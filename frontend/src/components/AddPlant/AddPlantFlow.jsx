import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PlantTypeSelection from './PlantTypeSelection';
import PlantDetailsForm from './PLantDetailsForm';
import SuccessConfirmation from './SuccessConfirmation';
import ProgressIndicator from './ProgressIndicator';

import { usePlants } from '../../context/PlantContext';
import { AppContent } from '../../context/AppContext';
import { RewardsContext } from '../../context/RewardsContext';

import './AddPlantFlow1.css';
import DisplayPlantData from './DisplayPlantData';

const AddPlantFlow = () => {
  const navigate = useNavigate();
  const { authToken } = useContext(AppContent);
  const {
    plantTypes,
    isLoading: contextLoading,
    error: contextError,
    fetchPlantTypes,
    addPlant
  } = usePlants();
  const {addPoints} = useContext(RewardsContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    plantType: null,
    nickname: '',
    condition: 'healthy',
    location: 'indoor',
    potSize: 'medium',
    acquisitionDate: new Date().toISOString().split('T')[0],
    wateringFrequency: "Medium",
    sunlightExposure: 'Medium Sun',
    WateringRate:1,

  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const totalSteps = 3;

  useEffect(() => {
    if (plantTypes.length === 0) {
      fetchPlantTypes();
    }
  }, [fetchPlantTypes, plantTypes.length]);

  const handleNext = async () => {
    const newErrors = validateStep(currentStep);
    if (Object.keys(newErrors).length === 0) {
      if (currentStep === totalSteps) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    const updatedErrors = { ...errors };
    Object.keys(data).forEach(key => {
      if (updatedErrors[key]) {
        delete updatedErrors[key];
      }
    });
    setErrors(updatedErrors);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.plantType) {
        newErrors.plantType = 'Please select a plant type';
      }
    }

    if (step === 2) {
      if (!formData.nickname.trim()) {
        newErrors.nickname = 'Please enter a nickname for your plant';
      } else if (formData.nickname.length > 30) {
        newErrors.nickname = 'Nickname must be 30 characters or less';
      }

      if (!formData.location) {
        newErrors.location = 'Please select a location';
      }

      if (!formData.acquisitionDate) {
        newErrors.acquisitionDate = 'Please enter when you got this plant';
      }
      if (!formData.wateringFrequency) {
        newErrors.wateringFrequency = 'Select watering frequency';
      }
      if (!formData.sunlightExposure) {
        newErrors.sunlightExposure = 'Select sunlight exposure';
      }
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {

      const plantData = {
        ...formData,
        plantType: formData.plantType
      };

      const result = await addPlant(plantData);
      // console.log('Plant added successfully:', result); // Debug log
      addPoints(10, "Adding a plant", "Added a Plant")
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/plants');
        window.location.reload()
      }, 2000);
    } catch (error) {
      console.error('Add plant error:', error); // Debug log
      setSubmitError(error.message || 'Failed to add plant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (contextLoading && currentStep === 1) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (contextError) {
      return (
        <div className="text-center py-8 text-red-500">
          {contextError}
          <button
            onClick={fetchPlantTypes}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <PlantTypeSelection
            plantTypes={plantTypes}
            selectedType={formData.plantType}
            onSelect={(type) => updateFormData({ plantType: type })}
            error={errors.plantType}
          />
        );
      case 2:
        return (
          <PlantDetailsForm
            formData={formData}
            onChange={(field, value) => updateFormData({ [field]: value })}
            errors={errors}
          />);
      
      case 3:
        return (
          <div>
            <DisplayPlantData
              formData={formData}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isSuccess) {
    return <SuccessConfirmation plantName={formData.nickname} />;
  }

  return (
    <div className="add-plant-container max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Add a New Plant</h1>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      <div className="step-content py-6">
        {renderStepContent()}
      </div>

      {submitError && (
        <div className="error-message text-red-500 mb-4 text-center">{submitError}</div>
      )}

      {/* Bottom */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className={`px-6 py-2 rounded-lg 
            ${currentStep === 1 || isSubmitting
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300'
            }`}
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting || contextLoading}
          className={`px-6 py-2 rounded-lg text-white 
            ${isSubmitting || contextLoading
            ? 'bg-green-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : currentStep === totalSteps ? (
            'Add Plant'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
};

export default AddPlantFlow;