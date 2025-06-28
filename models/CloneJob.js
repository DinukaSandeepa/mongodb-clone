import mongoose from 'mongoose';

const CloneJobSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: [true, 'Job name is required'],
    trim: true,
  },
  sourceConnectionString: {
    type: String,
    required: [true, 'Source connection string is required'],
    trim: true,
  },
  destinationConnectionString: {
    type: String,
    required: [true, 'Destination connection string is required'],
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.CloneJob || mongoose.model('CloneJob', CloneJobSchema);