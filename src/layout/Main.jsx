import Footer from "components/footer/Footer";
import Navbar from "components/navbar/Navbar";
import { Outlet } from "react-router-dom";



export default function Main() {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'none' }}>
      <div className="glass-navbar">
        <Navbar />
      </div>
      <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}