module.exports = {
	 POLLEN_API_URL: 'https://socialpollencount.co.uk/api/forecast',
	 GEOCODING_API_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
	 AMAZON_DEVICE_LOCATION_URL: deviceId => `https://api.amazonalexa.com/v1/devices/${deviceId}/settings/address/countryAndPostalCode`
};
