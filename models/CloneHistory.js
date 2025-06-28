import mongoose from 'mongoose';

const CloneHistorySchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CloneJob',
    required: true,
  },
  jobName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'running'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // Duration in milliseconds
  },
  collections: {
    type: Number,
    default: 0,
  },
  documents: {
    type: Number,
    default: 0,
  },
  sourceDatabase: {
    type: String,
  },
  destinationDatabase: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  stats: {
    totalCollections: Number,
    processedCollections: Number,
    totalDocuments: Number,
    clonedDocuments: Number,
  },
}, {
  timestamps: true,
});

export default mongoose.models.CloneHistory || mongoose.model('CloneHistory', CloneHistorySchema);