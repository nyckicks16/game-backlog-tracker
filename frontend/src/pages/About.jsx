import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">About Game Backlog Tracker</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            Welcome to the Game Backlog Tracker - your personal gaming companion for managing 
            your ever-growing collection of video games.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Features</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Add games to your personal collection</li>
            <li>Categorize games as Playing, Completed, or Backlog</li>
            <li>Track progress and add personal notes</li>
            <li>Rate and review completed games</li>
            <li>Search and filter your game library</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;