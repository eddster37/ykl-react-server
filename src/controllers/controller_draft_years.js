const DraftYears = require('../models/model_draft_years');

exports.getDraftYears = (request, response) => {
    DraftYears.find(
        {},
        {},
        { sort: {year: 1} },
        (error, years) => {
            if (error) {
                return response.mongoError(error);
            }
            return response.json(years);
        }
    );
}