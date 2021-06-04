const React = require('react')
const contest = require('../../../../contests/mayfes2021-marathon.js')
const TWEEN = require('@tweenjs/tween.js')
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome')
const {
  faFastBackward,
  faPlay,
  faPause,
} = require('@fortawesome/free-solid-svg-icons')

const getColor = (i) => {
  switch (i) {
    case 1:
      return '#dc3545'
    case 2:
      return '#ffc107'
    case 3:
      return '#198754'
    case 4:
      return '#0d6efd'
  }
}

class App extends React.Component {
  constructor (props, state) {
    super(props, state)
    const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'))

    const input = data.turns[0].input
    const output = data.turns[0].stdout

    const { map, n } = contest.parseInput(input)
    const operations = contest.parseOutput(output, n)

    this.displaySize = 1000
    this.itemOffset = (this.displaySize / 2
      + 2 // Half of gap
      - n * 24)

    console.log('Input:')
    console.log(input)
    console.log('Output:')
    console.log(output)

    this.state = {
      playing: false,
      duration: 250,
      map,
      n,
      operations,
      initialMap: _.cloneDeep(map),
      operatingIndex: 0,
    }

    this.svgRef = React.createRef()

    this.handleFastBackward = this.handleFastBackward.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.forwardStep = this.forwardStep.bind(this)
  }

  componentDidMount () {
    this.resetMap()
    const cb = () => {
      TWEEN.update()
      requestAnimationFrame(cb)
    }
    requestAnimationFrame(cb)
    // FIXME: destroy the callback on unmount

    document.addEventListener('keydown', (ev) => {
      if (this.state.operatingIndex !== this.state.operations.length) {
        if (this.state.playing) {
          this.handlePause()
        } else {
          this.handlePlay()
        }
        ev.preventDefault()
      }
    })
  }

  resetMap () {
    this.svgRef.current.innerHTML = ''
    this.els = this.state.map.map((row, y) => {
      return row.map((col, x) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        el.setAttribute('width', '20px')
        el.setAttribute('height', '20px')
        el.setAttribute('fill', getColor(col))
        el.setAttribute('x', `${this.itemOffset + x * 24}px`)
        el.setAttribute('y', `${this.itemOffset + y * 24}px`)

        this.svgRef.current.appendChild(el)
        return el
      })
    })
    this.transitionEls = Array(2 * this.state.n).fill(0).map(() => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      el.setAttribute('width', '20px')
      el.setAttribute('height', '20px')
      el.setAttribute('fill-opacity', '0')

      this.svgRef.current.appendChild(el)
      return el
    })
  }

  forwardStep () {
    const { direction, x, y } = this.state.operations[this.state.operatingIndex]
    const prepareTransitionEl = (target, source) => {
      ['fill', 'x', 'y'].forEach((a) => {
        target.setAttribute(a, source.getAttribute(a))
      })
    }
    const n = this.state.n
    const wait = this.state.duration
    const duration = wait * 0.85
    const animateObject = (el, from, to) => {
      const cb = (o) => {
        if (o.x != null) {
          el.setAttribute('x', `${this.itemOffset + o.x * 24}px`)
        }
        if (o.y != null) {
          el.setAttribute('y', `${this.itemOffset + o.y * 24}px`)
        }
        if (o.fillOpacity != null) {
          el.setAttribute('fill-opacity', `${o.fillOpacity}`)
        }
      }
      if (duration > 1) {
        new TWEEN.Tween(from).to(to, duration).easing(TWEEN.Easing.Cubic.InOut).onUpdate(cb).start()
      } else {
        cb(to)
      }
    }
    if (direction === 0) {
      const temp = [...this.els[y]]
      if (x < n) {
        for (let i = 0; i < x; i++) {
          const t = 2 * n + i - x
          animateObject(temp[i], { fillOpacity: 0, x: 2 * n + i }, { fillOpacity: 1, x: 2 * n + i - x })
          prepareTransitionEl(this.transitionEls[i], temp[i])
          animateObject(this.transitionEls[i], { fillOpacity: 1, x: i }, { fillOpacity: 0, x: i - x })
          this.els[y][t] = temp[i]
        }
        for (let i = x; i < 2 * n; i++) {
          const t = i - x
          animateObject(temp[i], { x: i }, { x: t })
          this.els[y][t] = temp[i]
        }
      } else {
        for (let i = 0; i < x; i++) {
          const t = 2 * n + i - x
          animateObject(temp[i], { x: i }, { x: t })
          this.els[y][t] = temp[i]
        }
        for (let i = x; i < 2 * n; i++) {
          const t = i - x
          animateObject(temp[i], { fillOpacity: 0, x: i - 2 * n }, { fillOpacity: 1, x: i - x })
          prepareTransitionEl(this.transitionEls[i], temp[i])
          animateObject(this.transitionEls[i], { fillOpacity: 1, x: i }, { fillOpacity: 0, x: 2 * n + i - x })
          this.els[y][t] = temp[i]
        }
      }
    } else {
      const temp = Array(2 * n).fill(0).map((_, i) => this.els[i][x])
      if (y < n) {
        for (let i = 0; i < y; i++) {
          const t = 2 * n + i - y
          animateObject(temp[i], { fillOpacity: 0, y: 2 * n + i }, { fillOpacity: 1, y: 2 * n + i - y })
          prepareTransitionEl(this.transitionEls[i], temp[i])
          animateObject(this.transitionEls[i], { fillOpacity: 1, y: i }, { fillOpacity: 0, y: i - y })
          this.els[t][x] = temp[i]
        }
        for (let i = y; i < 2 * n; i++) {
          const t = i - y
          animateObject(temp[i], { y: i }, { y: t })
          this.els[t][x] = temp[i]
        }
      } else {
        for (let i = 0; i < y; i++) {
          const t = 2 * n + i - y
          animateObject(temp[i], { y: i }, { y: t })
          this.els[t][x] = temp[i]
        }
        for (let i = y; i < 2 * n; i++) {
          const t = i - y
          animateObject(temp[i], { fillOpacity: 0, y: i - 2 * n }, { fillOpacity: 1, y: i - y })
          prepareTransitionEl(this.transitionEls[i], temp[i])
          animateObject(this.transitionEls[i], { fillOpacity: 1, y: i }, { fillOpacity: 0, y: 2 * n + i - y })
          this.els[t][x] = temp[i]
        }
      }
    }
    this.setState({
      operatingIndex: this.state.operatingIndex + 1,
    })
    if (this.state.playing && this.state.operatingIndex < this.state.operations.length) {
      this.pending = setTimeout(this.forwardStep, wait)
    } else {
      this.setState({playing: false})
    }
  }

  handleFastBackward () {
    const { initialMap } = this.state

    this.state.playing = false
    TWEEN.removeAll()

    this.setState(() => ({ map: _.cloneDeep(initialMap), operatingIndex: 0 }), () => {
      this.resetMap()
    })
  }

  handlePlay () {
    this.setState({
      playing: true,
    }, () => {
      this.forwardStep()
    })
  }

  handlePause () {
    this.setState({
      playing: false,
    })
  }

  handleSelect (event) {
    this.setState({ duration: parseInt(event.target.value) })
  }

  render () {
    const { playing, operations, operatingIndex } = this.state
    return (
      <div className="wrapper">
        <div className="viewbox">
          <div className="viewbox-inner">
            <svg
              style={{
                display: 'block',
                width: `${this.displaySize}px`,
                height: `${this.displaySize}px`,
                margin: '0 auto',
                boxSizing: 'content-box',
                position: 'relative',
              }}
              viewBox={`0 0 ${this.displaySize} ${this.displaySize}`}
              ref={this.svgRef}
            >
            </svg>
          </div>
        </div>
        <div
          className="score">
          {`Time: ${operatingIndex}`}
        </div>
        <div className="toolbar">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleFastBackward}
              disabled={playing || operatingIndex === 0}
              title="Fast Backward"
            >
              <FontAwesomeIcon icon={faFastBackward} fixedWidth/>
            </button>
            {playing
              ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handlePause}
                  title="Pause"
                >
                  <FontAwesomeIcon icon={faPause} fixedWidth/>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handlePlay}
                  title="Play"
                  disabled={operatingIndex === operations.length}
                >
                  <FontAwesomeIcon icon={faPlay} fixedWidth/>
                </button>
              )}
          </div>
          <select className="custom-select" value={this.state.value} onChange={this.handleSelect}>
            <option value="1000">1x</option>
            <option value="500">2x</option>
            <option value="333">3x</option>
            <option value="250" selected>4x</option>
            <option value="125">8x</option>
            <option value="50">20x</option>
            <option value="33">30x</option>
            <option value="16">60x</option>
            <option value="1">MAX (up to 1000x)</option>
          </select>
        </div>
      </div>
    )
  }
}

module.exports = App
