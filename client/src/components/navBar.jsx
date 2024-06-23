// components/NavBar.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../src/logo.jpg"; // Adjust the path to your logo file

const NavBar = () => {
  return (
    <nav className="bg-black p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Athena Logo"
            className="w-10 h-10 rounded-full"
          />
          <div className="text-white text-xl font-bold">Athena</div>
        </div>
        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-gray-400">
            Home
          </Link>
          <Link to="/library" className="text-white hover:text-gray-400">
            Library
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
