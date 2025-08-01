import React from 'react';

interface VendorApplicationStatusProps {
  status: string;
}

export const VendorApplicationStatus: React.FC<VendorApplicationStatusProps> = ({ status }) => {
  let title = 'Application Status';
  let message = 'We are currently reviewing your application. Please check your email for updates.';

  if (status === 'approved') {
    title = 'Application Approved';
    message = 'Congratulations! Your application has been approved. Please see your email for more details on the next steps.';
  } else if (status === 'rejected') {
    title = 'Application Update';
    message = 'Thank you for your interest. After careful consideration, we have decided not to move forward with your application at this time. Please see your email for more details.';
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};
