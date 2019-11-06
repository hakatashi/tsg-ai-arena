/* eslint-env browser */
const Docker = require('dockerode');
const assert = require('assert');
const Promise = require('bluebird');
const path = require('path');
const tmp = require('tmp');
const stream = require('stream');
const {stripIndent} = require('common-tags');
const {getCodeLimit, Deferred, createLineDrainer} = require('../lib/utils.js');
const logger = require('../lib/logger.js');
const fs = Promise.promisifyAll(require('fs'));

const docker = new Docker();

const memoryLimit = 512 * 1024 * 1024;

class MemoryLimitExceededError extends Error {
	constructor(...args) {
		super(...args);
		this.name = 'MemoryLimitExceededError';
	}
}

module.exports = ({id, code, stdinStream}) => new Promise((rootResolve) => {
	assert(typeof id === 'string');
	assert(Buffer.isBuffer(code));
	assert(code.length <= getCodeLimit(id));

	const stderrStream = new stream.PassThrough();
	const stdoutStream = new stream.PassThrough();
	const deferred = new Deferred();

	(async () => {
		const {tmpPath, cleanup} = await new Promise((resolve, reject) => {
			tmp.dir(
				{
					unsafeCleanup: true,
				},
				(error, dTmpPath, dCleanup) => {
					if (error) {
						reject(error);
					} else {
						resolve({
							tmpPath: dTmpPath,
							cleanup: dCleanup,
						});
					}
				},
			);
		});

		const codePath = path.join(tmpPath, 'CODE');

		await fs.writeFileAsync(codePath, code);

		let container = null;

		// eslint-disable-next-line init-declarations
		const dockerVolumePath = (() => {
			if (path.sep === '\\') {
				return tmpPath.replace('C:\\', '/c/').replace(/\\/g, '/');
			}

			return tmpPath;
		})();

		try {
			const runner = new Promise(async (resolve) => {
				logger.info('creating container');
				container = await docker.createContainer({
					Hostname: '',
					User: '',
					Tty: true,
					Env: null,
					Image: `esolang/${id}`,
					Volumes: {
						'/volume': {},
					},
					VolumesFrom: [],
					HostConfig: {
						Binds: [`${dockerVolumePath}:/volume:ro`],
						Memory: memoryLimit,
					},
				});

				logger.info('container created');

				await container.start();

				logger.info('container started');

				const execution = await container.exec({
					Cmd: ['script', '/volume/CODE'],
					AttachStdin: true,
					AttachStdout: true,
					AttachStderr: true,
				});

				logger.info('execution created');

				const executionStream = await execution.start({
					hijack: true,
					stdin: true,
				});

				logger.info('execution started');
				const executionStart = Date.now();

				stdinStream.pipe(executionStream);
				rootResolve({stdoutStream, stderrStream, deferred});

				container.modem.demuxStream(
					executionStream,
					stdoutStream,
					stderrStream,
				);

				await new Promise((resolve) => {
					executionStream.on('end', () => {
						resolve();
					});
				});

				logger.info('container ended');
				stdoutStream.end();
				stderrStream.end();
				const executionEnd = Date.now();

				const data = await container.inspect();

				deferred.resolve({
					duration: executionEnd - executionStart,
					...(data.State.OOMKilled
						? {
							error: new MemoryLimitExceededError(
								`Memory limit of ${memoryLimit} bytes exceeded`,
							),
							  }
						: {}),
				});

				await container.stop();
				logger.info('container stopped');

				await container.remove();
				logger.info('container removed');

				resolve();
			});

			await runner.timeout(15000);

			cleanup();
		} catch (error) {
			if (container) {
				await container.kill().catch((e) => {
					if (e.statusCode === 409) {
						logger.verbose(
							`Killing of container conflicted: ${container.id}`,
						);
					} else {
						throw e;
					}
				});
				await container.remove().catch((e) => {
					if (e.statusCode === 409) {
						logger.verbose(
							`Removal of container conflicted: ${container.id}`,
						);
					} else {
						throw e;
					}
				});
			}
			throw error;
		}
	})();
});

if (require.main === module) {
	const runner = module.exports;

	(async () => {
		const stdinStream = new stream.PassThrough();

		const {stdoutStream, stderrStream, deferred} = await runner({
			id: 'cpp-clang',
			code: Buffer.from(stripIndent`
				#include <stdio.h>

				int main() {
					int n;

					while (scanf("%d", &n) != EOF) {
						fprintf(stdout, "%d\\n", n * 2);
						fflush(stdout);
					}

					return 0;
				}
			`),
			stdinStream,
		});

		stderrStream.pipe(process.stderr);

		const drain = createLineDrainer(stdoutStream);

		let n = 1;

		while (n < 1000) {
			const input = `${(n * 2).toString()}\n`;

			const inputStart = Date.now();

			stdinStream.write(input);
			console.log('input:', input.trim());

			const output = await drain();

			const inputEnd = Date.now();

			console.log(
				'output:',
				output.trim(),
				`(duration: ${inputEnd - inputStart}ms)`,
			);
			n = parseInt(output);
		}

		deferred.promise.then(({duration}) => {
			console.log(`total duration: ${duration}ms`);
		});

		stdinStream.end();
	})();
}
