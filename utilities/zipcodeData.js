import request from 'request-promise';

export function zipcodeToStateDistrict(zipcode) {
    const lookupQuery = `zip=${zipcode}`;
    const apiRequestUrl = `https://congress.api.sunlightfoundation.com/districts/locate?apikey=${process.env.SUNLIGHT_FOUNDATION_KEY}&${lookupQuery}`;
    const getStateDist = request({uri: apiRequestUrl, json: true} )
        .then((response) => {
            return response.results[0];
        })
        .catch((err) => {
        console.log(err);
        return {'state': null, 'district':null};
        });
    return getStateDist;
}


