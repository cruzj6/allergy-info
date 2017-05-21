'use strict';
const Alexa = require('alexa-sdk');
const axios = require('axios');
const CONSTS = require('./constants');

const APP_ID = undefined;
const SKILL_NAME = 'Allergy Info';
const key = process.env.GEOCODING_KEY;

const fetchLocationForZip = zipcode => (
	axios.get(CONSTS.GEOCODING_API_URL, { params: { address: zipcode, key }})
		.then(res => ({
			lat: res.data.results[0].geometry.location.lat,
			lon: res.data.results[0].geometry.location.lng
		}))
)

const fetchAllergyData = zipcode => (
	 fetchLocationForZip(zipcode).then(loc =>

		 axios.get(CONSTS.POLLEN_API_URL + `?location=[${loc.lat}, ${loc.lon}]`)
			.then(response => response.data ? response.data.forecast[3] : null)
			.catch(err => console.error('ERROR: making request to pollen api', { err }))
	)
)

const fetchDeviceLocation = (deviceId, consentToken) => (
	axios.get(AMAZON_DEVICE_LOCATION_URL(deviceId), {
		headers: {
			Host: 'api.amazonalexa.com',
			Accept: 'application/json',
			Authorization: `Bearer ${consentToken}`
		}
	}).catch(err => console.error('ERROR: making request for device info', { err }))
)

const handlers = {
	LaunchRequest () {
		this.emit('GetAllergyInfoIntent');
	},

	GetAllergyInfoIntent () {
		const consentToken = this.event.session.user.permissions.consentToken;
		const deviceId = this.event.context.System.device.deviceId;

		fetchDeviceLocation(deviceId, consentToken)
			.then(loc => fetchAllergyData(loc.postalCode))
			.then(forecast => {
				const response = `Today in ${location.city} ${location.state}, pollen count is ${forecast.pollen_count}`;
				this.emit(':tellWithCard', response, SKILL_NAME, response);
			});
	},

	'AMAZON.HelpIntent': function () {
		const speechOutput = "You can ask me for the current pollen count";
		const reprompt = "What can I help you with?";

		this.emit(':ask', speechOutput, reprompt);
	},

	'AMAZON.CancelIntent': function () {
		this.emit(':tell', 'Goodbye!');
	},

	'AMAZON.StopIntent': function () {
		this.emit(':tell', 'Goodbye!');
	}
};

exports.handler = (event, context, callback) => {
	const alexa = Alexa.handler(event, context);

	alexa.registerHandlers(handlers);
	alexa.execute();
};
