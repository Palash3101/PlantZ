//AppContext.jsx
import { createContext } from "react";
import {useState, useEffect} from 'react'
import {toast}  from 'react-toastify'
import axios from 'axios';
import { useLocation } from "react-router-dom";
import { WaterChange, Notifier } from "../services/plantNotification";

export const AppContent = createContext()

export const AppContextProvider = (props) => {

  const location = useLocation();

  axios.defaults.withCredentials = true;
 
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(false)
  const [plants, setPlants] = useState(null)
  const [userEmail, setUserEmail] = useState(''); // State to hold user email

const getAuthState = async () => {
    try {
        const { data } = await axios.get(backendUrl + '/api/auth/is-auth');
        if (data.success) {

            if (!plants){
              try{
                const {data} = await axios.get(backendUrl+'/api/plants')
                WaterChange(data.data)
                Notifier(data.data)
                setPlants(data.data)
              }
              catch (err){
                console.log("Failed")
              }
            }

            setIsLoggedIn(true);
            getUserData();
        } else {
            setIsLoggedIn(false);
            setUserData(null);
        }
    } catch (error) {
        setIsLoggedIn(false);
        setUserData(null);
        toast.error(error.message); // Comment out or remove toast here
    }
};


const getUserData = async () => {
  try {
      const { data } = await axios.get(backendUrl + '/api/user/data');
      
      data.success ? setUserData(data.userData) : toast.error(data.message);
  } catch (error) {
      toast.error(error.message);
  }
}

useEffect(()=>{
  if (location.pathname !== '/dashboard') {
    getAuthState();
  }
},[location.pathname])
  
  const value = {
      backendUrl,
      isLoggedIn, setIsLoggedIn,
      userData, setUserData,
      getUserData,
      plants, setPlants,
      userEmail, setUserEmail 
  }
   

  return (
    <AppContent.Provider value={value}>
      {props.children}
    </AppContent.Provider>
  )
}
