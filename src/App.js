import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import {useState, useEffect} from 'react';
import Toast from './components/Toast'; 


export default function App() {
  const [offices, setOffices] = useState([]);
  const [toast, setToast] = useState(null);


  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    async function fetchOffices() {
      try {
        const res = await fetch('http://localhost:8000/filesharing/offices/');
        const data = await res.json();
        setOffices(data);
      } catch (err) {
        console.error('Failed to load offices', err);
        showToast('Failed to load office list', 'error');
      }
    }

    fetchOffices();
  }, []);
    return(
      <BrowserRouter>
        <Routes>
          <Route path = "/" element = {<Login />} />
          <Route path = "/signup" element = {<Signup offices={offices} />} />
          <Route path = "/login" element = {<Login />} />
          <Route path = "/dashboard" element = {<Dashboard offices={offices} />} />
        </Routes> 
      </BrowserRouter>
    )
}