const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
document.querySelector('#app').textContent = data.players.join();
