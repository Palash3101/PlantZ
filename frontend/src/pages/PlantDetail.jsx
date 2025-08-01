import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaWater,
  FaSun,
  FaLeaf,
  FaArrowLeft,
  FaTint,
  FaCloudSun,
  FaSeedling,
  FaTrash,
  FaSortAmountDown
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

import potData from '../data/potData';
import { AppContent } from '../context/AppContext';

const PlantDetail = () => {
  // Router hooks
  const { plantId } = useParams();
  const navigate = useNavigate();
  const {plants, setPlants} = useContext(AppContent)
  
  // State management
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterAmount, setWaterAmount] = useState();

  // Configuration
  const authToken = localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Success messages for different actions
  const careActionMessages = {
    water: "Ahh, thank you for watering me! I feel refreshed now.",
    sunlight: "Thank you for moving me to a sunnier spot! I love soaking up the rays.",
    fertilize: "Yum! Thank you for the nutrients. I'll grow even stronger now!"
  };

  //Setting up plants
  useEffect(()=>{
    if (plants){
      const selectedPlant = plants.find(item => item._id === plantId);
      setPlant(selectedPlant);
    }
  }, [plants])

  useEffect(()=>{
    if (plant){
      setLoading(false)
    }
  }, [plant])


  useEffect(()=>{
    return ()=>{
      if (plant){
        // Update plants array - keep all other plants the same, only update the current plant
        setPlants(prevPlants => 
          prevPlants.map(p => 
            p._id === plant._id ? plant : p
          )
        );
        
        axios.put(
          `${backendUrl}/api/plants/upload/${plant._id}`,
          { plant },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
          }
        ).catch((err) => {
          console.log('PUT request error:', err.message);
        });
      }

      // console.log(plant)

    };
  }, [plantId, backendUrl, authToken])


  // Handle plant care actions

  const handleCareAction = async (action, amount = null) => {
    if (action === 'water' && !amount) {
      setShowWaterModal(true);
      return;
    }

    if (action === 'water') {
      addingWater(amount);
      setActionMessage(careActionMessages[action]);
      setShowWaterModal(false);
      setWaterAmount('');
      return;
    }

    setActionMessage(careActionMessages[action] || "Action completed successfully");
  };


  function addingWater(amount) {
    const potQuantity = potData[plant.potSize];
    let waterLevel = (plant.careMetrics.water * potQuantity) / 100;
    const amountNum = parseFloat(amount);
    waterLevel += amountNum;
    const percentage = Math.round((waterLevel / potQuantity) * 100);
    setPlant(prevPlant => ({
      ...prevPlant,
      careMetrics: {
        ...prevPlant.careMetrics,
        water: percentage
      },
      lastWatered: new Date().toISOString()
    }));
  }

  // Loading state
  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-green-600 text-4xl">
          <FaLeaf />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto px-4 py-6 text-center text-red-500 flex">
        {error}
        <button
          onClick={() => navigate('/plants')}
          className="mt-4 text-green-600 hover:text-green-700 flex items-center justify-center mx-auto"
        >
          <FaArrowLeft className="mr-2" /> Back to Plants
        </button>
      </div>
    );
  }

  async function handleDelete(){
    try{
      const response = await axios.delete(`${backendUrl}/api/plants/${plantId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      toast.success("Plant removed")
      navigate('/plants')
      window.location.reload()
    }

    catch (err){
      setError(err.response?.data?.message || 'Failed to delete plant');
    }
  }

  // Water Modal Component
  const WaterModal = () => {
    if (!showWaterModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-6 w-96 shadow-xl"
          key="water-modal"
        >
          <div className="modal-content">
            <h3 className="text-xl font-bold text-gray-800 mb-4">How much water did you add?</h3>
            <div className="mb-4">
              <input
                type="number"
                value={waterAmount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setWaterAmount(value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter amount in litre"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWaterModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWaterModal(false);
                  handleCareAction('water', waterAmount);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative">
      <WaterModal />
      {/* Header with back button */}
      <div className="container mx-auto px-4 py-6">
        <div className='flex justify-between'>
          <motion.button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-3 text-green-700 hover:text-green-800 mb-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft className="text-lg" />
            <span className="font-medium">Back to Plants</span>
          </motion.button>

          <motion.button
            onClick={handleDelete} // TODO: Add delete logic
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all mb-3"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTrash className="text-lg" />

          </motion.button>
        </div>

        {/* Notification Messages */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FaLeaf className="text-green-600" />
              {actionMessage}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-100 border border-red-200 text-red-800 p-4 rounded-xl shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Plant Profile Card */}
          <div className="xl:col-span-5">
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Plant Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-green-800 mb-2">{plant.nickname}</h1>
                <p className="text-lg text-gray-600 italic">{plant.plantType}</p>
              </div>

              {/* Plant Image */}
              <div className="relative mb-8">
                <div className="h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner">
                  {plant.avatar?.url ? (
                    <img
                      src={plant.avatar.url}
                      alt={plant.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaLeaf className="text-green-300 text-8xl" />
                    </div>
                  )}
                </div>
              </div>

              {/* Plant Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard
                  icon={<FaLeaf className="text-green-500" />}
                  label="Age"
                  value={plant.age ? `${plant.age} months` : 'Unknown'}
                />
                <StatCard
                  icon={<FaSeedling className="text-emerald-500" />}
                  label="Care Level"
                  value={plant.careLevel || 'Medium'}
                />
                <StatCard
                  icon={<FaCloudSun className="text-amber-500" />}
                  label="Location"
                  value={plant.location}
                />
                <StatCard
                  icon={<FaWater className="text-blue-500" />}
                  label="Last Watered"
                  value={plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : 'Never'}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <CareButton
                  icon={<FaTint />}
                  label="Water"
                  onClick={() => handleCareAction('water')}
                  loading={actionLoading}
                  color="blue"
                />
                {/* <CareButton
                  icon={<FaCloudSun />}
                  label="Sunlight"
                  onClick={() => handleCareAction('sunlight')}
                  loading={actionLoading}
                  color="amber"
                /> */}
                <CareButton
                  icon={<FaSeedling />}
                  label="Fertilize"
                  onClick={() => handleCareAction('fertilize')}
                  loading={actionLoading}
                  color="emerald"
                />
              </div>
              
            </motion.div>
          </div>

          {/* Metrics and History */}
          <div className="xl:col-span-7 space-y-6">
            {/* Care Metrics */}
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <FaLeaf className="text-green-600" />
                Care Metrics
              </h2>

              <div className="space-y-6">
                <MetricBar
                  icon={<FaWater className="text-blue-500" />}
                  label="Water Level"
                  value={plant.careMetrics?.water || 0}
                  color="blue"
                />
                {/* <MetricBar
                  icon={<FaSun className="text-yellow-500" />}
                  label="Sunlight"
                  value={plant.careMetrics?.sunlight || 0}
                  color="yellow"
                /> */}
                <MetricBar
                  icon={<FaLeaf className="text-green-500" />}
                  label="Fertilizer"
                  value={plant.careMetrics?.fertilizer || 0}
                  color="green"
                />
              </div>
            </motion.div>

            {/* Care History */}
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <FaLeaf className="text-green-600" />
                Care History
              </h2>

              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-green-200"></div>
                
                <div className="space-y-6">
                  {plant.lastWatered && (
                    <CareHistoryItem 
                      action="watered" 
                      date={plant.lastWatered}
                      amount={`${plant.careMetrics?.water || 0}%`}
                      icon={<FaWater className="text-white" />}
                      color="blue"
                    />
                  )}
                  {plant.lastFertilized && (
                    <CareHistoryItem 
                      action="fertilized" 
                      date={plant.lastFertilized}
                      amount={`${plant.careMetrics?.fertilizer || 0}%`}
                      icon={<FaSeedling className="text-white" />}
                      color="green"
                    />
                  )}
                  {plant.careHistory?.length > 0 ? (
                    plant.careHistory.map((event, index) => (
                      <HistoryItem key={index} event={event} />
                    ))
                  ) : !plant.lastWatered && !plant.lastFertilized && (
                    <div className="text-center py-12 text-gray-500">
                      <FaLeaf className="text-4xl mx-auto mb-4 text-gray-300" />
                      <p>No care history yet. Start caring for your plant!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Health Check Buttons */}
            <motion.div
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <FaLeaf className="text-green-600" />
                Plant Health Tools
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <CareButton
                  icon={<FaLeaf />}
                  label="Check Health"
                  onClick={() => navigate('/health')}
                  loading={false}
                  color="emerald"
                />
                <CareButton
                  icon={<FaSeedling />}
                  label="Disease Detection"
                  onClick={() => navigate('/disease')}
                  loading={false}
                  color="blue"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition-shadow duration-200">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="text-sm font-semibold text-gray-800 capitalize">{value}</div>
  </div>
);

// Component: Care Button
const CareButton = ({ icon, label, onClick, loading, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className={`${colorClasses[color]} text-white py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
      whileHover={{ scale: loading ? 1 : 1.05 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
};

// Component: Metric Bar
const MetricBar = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3 text-lg font-medium text-gray-700">
          {icon}
          {label}
        </span>
        <span className="text-lg font-bold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`${colorClasses[color]} h-3 rounded-full shadow-sm`}
          style={{ width: `${value}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

// Component: Care History Item
const CareHistoryItem = ({ action, date, amount, icon, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    green: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
  };

  const dotColorClasses = {
    blue: 'bg-blue-500 ring-4 ring-blue-200',
    green: 'bg-green-500 ring-4 ring-green-200',
    amber: 'bg-amber-500 ring-4 ring-amber-200'
  };

  return (
    <motion.div
      className="relative flex items-start gap-4 ml-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute left-4 mt-4 w-5 h-5 ${dotColorClasses[color]} rounded-full shadow-lg border-2 border-white`}></div>
      <div className={`ml-10 ${colorClasses[color]} rounded-2xl p-5 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-2 border-white/20`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl drop-shadow-sm">{icon}</span>
            <span className="font-bold text-lg capitalize">Last {action}</span>
          </div>
        </div>
        <div className="text-sm text-white/90 font-medium">
          {new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Component: History Item
const HistoryItem = ({ event }) => (
  <motion.div
    className="relative flex items-start gap-4 ml-2"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="absolute left-4 mt-2 w-4 h-4 bg-green-500 rounded-full shadow-md border-2 border-white"></div>
    <div className="ml-10 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="font-semibold text-gray-800 capitalize">{event.action}</div>
      <div className="text-sm text-gray-500 mt-1">
        {new Date(event.date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  </motion.div>
);

export default PlantDetail;