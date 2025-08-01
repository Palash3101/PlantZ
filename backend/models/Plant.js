import mongoose from 'mongoose';

const PlantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plantType: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  age: {
    type: Number, // in months
    default: 0
  },
  condition: {
    type: String,
    enum: ['healthy', 'needsAttention', 'struggling', 'thriving'],
    default: 'healthy'
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'balcony', 'patio'],
    default: 'indoor'
  },
  potSize: {
    type: String,
    enum: ['xsmall','small', 'medium', 'large', 'xlarge'],
    default: 'medium'
  },
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  lastWatered: {
    type: Date
  },
  lastFertilized: {
    type: Date
  },
  lastRepotted: {
    type: Date
  },
  careMetrics: {
    water: { type: Number, min: 0, max: 100, default: 50 },
    sunlight: { type: Number, min: 0, max: 100, default: 50 },
    fertilizer: { type: Number, min: 0, max: 100, default: 50 }
  },
  wateringNeeds: {
    type: Number, // in liters per day
    default: 1
  },
  sunlightNeeds: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Plant', PlantSchema);