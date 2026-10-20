import React, { useState } from 'react';
import type { ResidentSettingsState } from '../../../domains/profile';
import { Button, Toast } from '../../common';
import { Bell, Lock, LogOut, ArrowLeft, Info } from 'lucide-react';
import '../resident.css';
import '../more/more.css';

export interface SettingsHomeProps {
  onBackToMore: () => void;
}

export const SettingsHome: React.FC<SettingsHomeProps> = ({ onBackToMore }) => {
  const [settings, setSettings] = useState<ResidentSettingsState>({
    visitorPasscodeAlerts: true,
    announcementAlerts: true,
    paymentReminders: true,
    maintenanceUpdates: true,
    maskPasscodeByDefault: true,
    directoryOptOut: false,
    themePreference: 'system',
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleSetting = (key: keyof ResidentSettingsState) => {
    const updated = !settings[key];
    setSettings({ ...settings, [key]: updated });
    setToastMsg('Preference updated');
  };

  return (
    <div className="res-settings-container">
      {toastMsg && <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />}

      <div className="res-screen-header">
        <button className="vis-back-icon-btn" onClick={onBackToMore} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="vis-screen-title">Settings & Preferences</h2>
          <p className="vis-screen-subtitle">App notifications, privacy & account options</p>
        </div>
      </div>

      {/* Notifications Section */}
      <section className="res-settings-section">
        <div className="res-section-title-row">
          <div className="res-title-with-icon">
            <Bell size={16} className="res-section-ic" />
            <h3 className="res-section-heading">Notifications & Alerts</h3>
          </div>
        </div>

        <div className="res-settings-list">
          <div className="res-setting-item">
            <div>
              <h4 className="setting-title">Visitor Entry Alerts</h4>
              <p className="setting-sub">Receive instant alerts when guests or cabs arrive at main gate</p>
            </div>
            <button
              className={`res-toggle-btn ${settings.visitorPasscodeAlerts ? 'active' : ''}`}
              onClick={() => toggleSetting('visitorPasscodeAlerts')}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="res-setting-item">
            <div>
              <h4 className="setting-title">Society Announcements</h4>
              <p className="setting-sub">Alerts for urgent maintenance notices and GMB meetings</p>
            </div>
            <button
              className={`res-toggle-btn ${settings.announcementAlerts ? 'active' : ''}`}
              onClick={() => toggleSetting('announcementAlerts')}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="res-setting-item">
            <div>
              <h4 className="setting-title">Maintenance Fee Reminders</h4>
              <p className="setting-sub">Dues generated and invoice payment reminders</p>
            </div>
            <button
              className={`res-toggle-btn ${settings.paymentReminders ? 'active' : ''}`}
              onClick={() => toggleSetting('paymentReminders')}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="res-settings-section">
        <div className="res-section-title-row">
          <div className="res-title-with-icon">
            <Lock size={16} className="res-section-ic" />
            <h3 className="res-section-heading">Privacy & Passcode Settings</h3>
          </div>
        </div>

        <div className="res-settings-list">
          <div className="res-setting-item">
            <div>
              <h4 className="setting-title">Mask Visitor Passcode by Default</h4>
              <p className="setting-sub">Hide 4-digit passcode on Home screen until "Show Pass" is clicked</p>
            </div>
            <button
              className={`res-toggle-btn ${settings.maskPasscodeByDefault ? 'active' : ''}`}
              onClick={() => toggleSetting('maskPasscodeByDefault')}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="res-setting-item">
            <div>
              <h4 className="setting-title">Hide Contact in Resident Directory</h4>
              <p className="setting-sub">Opt-out of phone number visibility in community directory</p>
            </div>
            <button
              className={`res-toggle-btn ${settings.directoryOptOut ? 'active' : ''}`}
              onClick={() => toggleSetting('directoryOptOut')}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </section>

      {/* About & Simulated Sign Out */}
      <section className="res-settings-section">
        <div className="res-about-card">
          <Info size={18} className="about-ic" />
          <div>
            <h4 className="about-title">Dwellora Platform v1.0.0</h4>
            <p className="about-sub">Multi-tenant Residential Community Management Platform</p>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={() => setToastMsg('Simulated Sign Out action completed')}
          leftIcon={<LogOut size={16} />}
        >
          Sign Out (Simulated)
        </Button>
      </section>
    </div>
  );
};
