import React from 'react';

const TailwindTest = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          Tailwind CSS Test
        </h1>
        <p className="text-gray-600">
          If you can see this styled content, Tailwind CSS is working correctly!
        </p>
      </div>

      {/* Color Palette Test */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-primary-50 p-4 rounded-lg text-center">
          <div className="text-primary-900 font-semibold">Primary 50</div>
        </div>
        <div className="bg-primary-500 p-4 rounded-lg text-center text-white">
          <div className="font-semibold">Primary 500</div>
        </div>
        <div className="bg-primary-900 p-4 rounded-lg text-center text-white">
          <div className="font-semibold">Primary 900</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-gray-900 font-semibold">Gray 100</div>
        </div>
      </div>

      {/* Button Test */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="btn-primary">Primary Button</button>
        <button className="btn-secondary">Secondary Button</button>
        <button className="btn-danger">Danger Button</button>
        <button className="btn-success">Success Button</button>
      </div>

      {/* Card Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Card Title</h3>
            <p className="card-subtitle">Card subtitle with description</p>
          </div>
          <p className="text-gray-600">
            This is a test card to verify that our custom card classes are working.
          </p>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Another Card</h3>
            <p className="card-subtitle">More test content</p>
          </div>
          <p className="text-gray-600">
            Cards should have hover effects and proper spacing.
          </p>
        </div>
      </div>

      {/* Form Test */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Form Elements Test</h3>
        <div className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label className="form-label">Error Input</label>
            <input 
              type="text" 
              className="input-field input-field-error" 
              placeholder="This input has an error"
            />
            <p className="form-error">This field is required</p>
          </div>
        </div>
      </div>

      {/* Badge Test */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="badge badge-success">Success</span>
        <span className="badge badge-warning">Warning</span>
        <span className="badge badge-danger">Danger</span>
        <span className="badge badge-info">Info</span>
      </div>

      {/* Animation Test */}
      <div className="text-center">
        <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading spinner animation</p>
      </div>
    </div>
  );
};

export default TailwindTest; 