const generatePatientUid = () => {
    return "PAT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
};

module.exports = generatePatientUid;
