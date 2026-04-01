import React from 'react';

interface VerificationEmailProps {
  name: string;
  verificationLink: string;
}

export const VerificationEmailTemplate: React.FC<VerificationEmailProps> = ({
  name,
  verificationLink
}) => {
  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#f8fafc',
      padding: '40px 20px',
      color: '#1e293b'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          backgroundColor: '#2563eb',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            OceanMind<span style={{ opacity: 0.8 }}>+</span>
          </h1>
        </div>
        
        <div style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            Verify your email address
          </h2>
          <p style={{ lineHeight: '1.6', color: '#64748b', marginBottom: '24px' }}>
            Hello {name || 'Guardian'},<br /><br />
            Welcome to OceanMind+! To start monitoring our oceans and managing waste efficiently, please verify your email address by clicking the button below.
          </p>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <a href={verificationLink} style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
            }}>
              Verify Email Address
            </a>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '32px 0' }} />
          
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            If you didn't create an account with OceanMind+, you can safely ignore this email.<br />
            © 2026 OceanMind+ Team. Towards a cleaner ocean.
          </p>
        </div>
      </div>
    </div>
  );
};
