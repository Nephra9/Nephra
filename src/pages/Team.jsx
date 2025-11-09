import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import SolarSystem from "./SolarSystem";

const Team = () => {
  const teamMembers = [
    { name: "Nephra", role: "AI Research Hub", bio: "Empowering innovation through intelligent automation and creative technology.", },
    { name: "MR.Mercury", role: "AI Engineer", bio: "Focused on building intelligent systems and optimizing model performance.", },
    { name: "MR.Venus", role: "Project Lead", bio: "Leads innovative projects and ensures seamless product delivery.", },
    { name: "MR.Earth", role: "Frontend Developer", bio: "Creates engaging user interfaces with a focus on performance and accessibility.", },
    { name: "MR.Mars", role: "Backend Developer", bio: "Designs scalable server architectures and ensures smooth API integrations.", },
    { name: "MR.Jupiter", role: "Data Scientist", bio: "Transforms raw data into actionable insights using advanced statistical techniques.", },
    { name: "MR.Saturn", role: "ML Researcher", bio: "Explores cutting-edge AI models and contributes to research publications.", },
    { name: "MR.Uranus", role: "UI/UX Designer", bio: "Designs intuitive user experiences and ensures aesthetic consistency.", },
    { name: "MR.Neptune", role: "Cloud Engineer", bio: "Manages cloud infrastructure and optimizes deployment workflows.", },
    { name: "MR.Pluto", role: "DevOps Engineer", bio: "Automates deployment pipelines and ensures system reliability.", },
  ];

  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);

  // Stable callback: does not change on re-render
  const handlePlanetHover = useCallback((planetName) => {
    const found = teamMembers.find((m) => m.name === planetName) || teamMembers[0];
    setSelectedMember(found);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Our Team
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Meet the passionate leaders and researchers who make Nephra possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10" style={{ height: "40rem" }}>
            {/* LEFT — Info Card */}
          <div
  className="md:w-[30%] w-full flex flex-col justify-center items-center text-white rounded-2xl shadow-xl p-8"
  style={{ backgroundColor: "black" }}
>
  <motion.div
    key={selectedMember.name}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center"
  >
    {/* 👇 Team Member Image */}
    <img
      src={`/TeamMembers/img_${teamMembers.findIndex((m) => m.name === selectedMember.name) + 1}.png`}
      alt={selectedMember.name}
      onError={(e) => {
        e.currentTarget.src = "/C-ON.png"; // fallback image
      }}
      className="w-40 h-40 object-cover rounded-full mx-auto mb-5 border-4 border-gray-700 shadow-lg"
   style={{backgroundColor:"white"}} />

    {/* Member Info */}
    <h2 className="text-3xl font-bold mb-2">{selectedMember.name}</h2>
    <h3 className="text-lg text-gray-300 mb-3">{selectedMember.role}</h3>
    <p className="text-gray-400 mb-4">{selectedMember.bio}</p>
  </motion.div>
</div>


            {/* RIGHT — Solar System */}
            <div
              className="md:w-[70%] w-full flex justify-center items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              style={{ overflow: "hidden" }}
            >
              <SolarSystem onPlanetHover={handlePlanetHover} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Team;
