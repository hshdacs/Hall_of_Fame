const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId,
  serviceName: [
    {
        name: {
          type: String,
        },
        port: { type: Number },
        type: {
          type: String,
        }
    }
  ],
  dockerFiles: [{ fileName: {
    type: String,
  }, content: {
    type: String,
  } }]
});

module.exports = mongoose.model('Configuration', configurationSchema);
