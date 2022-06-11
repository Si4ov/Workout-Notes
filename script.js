'use strict';




const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
  date = new Date();
  id = ((Math.random()*1000).toFixed(0) + 1000);
  constructor(coords,distance,duration){
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; // in min
  }

  setDescrip(){
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${ months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords,distance,duration,cadence){
    super(coords,distance,duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescrip();
  }
  calcPace(){
    this.pace =  this.duration/this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'
  constructor(coords,distance,duration,elGain){
    super(coords,distance,duration);
    this.elGain = elGain;
    this.calcSpeed();
    this.setDescrip();
  }
  calcSpeed(){
    this.speed = this.distance/(this.duration/60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEv;
  #mapzoomlvl = 14;
  workouts = [];
  constructor(){
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this))
    form.addEventListener('submit', this._hideForm.bind(this))
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // GET CURR POSITION 
  _getPosition(){
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
      alert('GIVE PERMISSION TO USE');
    })
  }

  // LOAD MAP 

  _loadMap(data){
      const {latitude} = data.coords;
      const {longitude} = data.coords;
      const coords = [latitude, longitude];
      this.#map = L.map('map').setView(coords, this.#mapzoomlvl);


    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    L.marker(coords)
        .addTo(this.#map)
        .bindPopup('Your current location')
        .openPopup();
    this.#map.on('click', this._showForm.bind(this))
      console.log(`https://www.google.com/maps/@${latitude},${longitude},13z?hl=en`);

      
      this.workouts.forEach( i => this._renderWorkoutMarker(i));
  }
  _showForm(mapE){
    this.#mapEv = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm(mapE){
    this.#mapEv = mapE;
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000);
  }
  
  _toggleElevationField(){
      inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e){
      e.preventDefault();

      const validInputs = function (...data){
        return data.every( i => Number.isFinite(i));
      }
      const positiveAll = function (...data){
        return data.every( i => i > 0);
      }

      //get data
     const type = inputType.value;
     const distance = +inputDistance.value;
     const duration = +inputDuration.value;
     const {lat, lng} = this.#mapEv.latlng;
     let workout;
      //check  data


      if(type === 'running'){
        const cadence = +inputCadence.value;
        if( !validInputs(distance, duration, cadence) || !positiveAll(distance, duration, cadence)){
          return alert('Inputs have to be positive number!');
        }
        workout = new Running([lat,lng],distance,duration,cadence);

      }

      if(type === 'cycling'){
        const elevation = +inputElevation.value;
        if( !validInputs(distance, duration, elevation) || !positiveAll(distance, duration)) {
          return alert('Inputs have to be positive number!');
        }
        workout = new Cycling([lat,lng],distance,duration,elevation);
      }

      this.workouts.push(workout);
      this._hideForm;
      this._renderWorkoutMarker(workout);
      this._renderWorkout(workout);
      this._setLocalStorage();

      // clear input
      inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

  }
  _renderWorkoutMarker(data){
    L.marker(data.coords)
    .addTo(this.#map)
    .bindPopup(L.popup({
      maxWidth: 270,
      maxHeight:100,
      autoClose: false,
      closeOnClick: false,
      className: `${data.type}-popup`}))
    .setPopupContent(`${data.type === 'running' ? '🏃‍♂️':'🚴‍♀️'} ${String(data.description)}`)
    .openPopup();
  }

  _renderWorkout(data){
    let htmlTemp = `
  <li class="workout workout--${data.type}" data-id="${data.id}">
    <h2 class="workout__title">${data.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${data.type === 'running' ? '🏃‍♂️':'🚴‍♀️'}</span>
      <span class="workout__value">${data.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${data.duration}</span>
      <span class="workout__unit">min</span>
    </div>`
    if(data.type === 'running'){
      htmlTemp += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${data.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${data.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`
    }
    if(data.type === 'cycling'){
      htmlTemp += `
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${data.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${data.elGain}</span>
        <span class="workout__unit">m</span>
      </div>
  </li>`
    }
    form.insertAdjacentHTML('afterend', htmlTemp);
  }
  _moveToPopup(e){
    const workEl = e.target.closest('.workout');
    if(!workEl) return;
    const workout = this.workouts.find( (work) => work.id === workEl.dataset.id)
    this.#map.setView(workout.coords , this.#mapzoomlvl,{
      animate: true,
      pan: {
        duration: 1
      }
    });
  }
  _setLocalStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    if(!data) return;
    this.workouts = data;
    this.workouts.forEach( i => this._renderWorkout(i));
  }
  reset(){
    localStorage.removeItem('workouts');
    location.reload;
  }
}

const app = new App();
