'use strict';
const Alexa = require('alexa-sdk');
const axios = require('axios');
const CONSTS = require('./constants');

const APP_ID = undefined;
const SKILL_NAME = 'Allergy Info';
const key = process.env.GEOCODING_KEY;

const fetchLocationForZip = zipcode => (
	axios.get(CONSTS.GEOCODING_API_URL, { params: { address: zipcode, key }})
		.then(res => {
			const results = res.data.results[0];

			return {
				lat: results.geometry.location.lat,
				lon: results.geometry.location.lng,
				city: results.address_components[1].long_name,
				state: results.address_components[3].long_name
			}
		})
)

const fetchAllergyData = loc => (
		 axios.get(CONSTS.POLLEN_API_URL + `?location=[${loc.lat}, ${loc.lon}]`)
			.then(response => response.data ? response.data.forecast[3] : null)
			.catch(err => console.error('ERROR: making request to pollen api', { err }))
)

const fetchDeviceLocation = (deviceId, consentToken) => (
	axios.get(CONSTS.AMAZON_DEVICE_LOCATION_URL(deviceId), {
		headers: {
			Host: 'api.amazonalexa.com',
			Accept: 'application/json',
			Authorization: `Bearer ${consentToken}`
		}
	})
	.then(res => ({ zipcode: res.data.postalCode, countryCode: res.data.countryCode }))
	.catch(err => console.error('ERROR: making request for device info', { err }))
)

const handlers = {
	LaunchRequest () {
		this.emit('GetAllergyInfoIntent');
	},

	GetAllergyInfoIntent () {
		let location;
		const consentToken = this.event.session.user.permissions.consentToken;
		const deviceId = this.event.context.System.device.deviceId;

		fetchDeviceLocation(deviceId, consentToken)
			.then(deviceLocation => fetchLocationForZip(deviceLocation.zipcode))
			.then(loc => location = loc )
			.then(loc => fetchAllergyData(loc))
			.then(forecast => {
				const response = `Today in ${location.city} ${location.state ? location.state : ''}, pollen count is ${forecast.pollen_count}`;
				this.emit(':tellWithCard', response, SKILL_NAME, response);
			})
			.catch(error => console.error('ERROR: ', { error }));
	},

	Unhandled () {
		const speechOutput = "You can ask me for the current pollen count";
		const reprompt = "What can I help you with?";

		this.emit(':ask', speechOutput, reprompt);
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
