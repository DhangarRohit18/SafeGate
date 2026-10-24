import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, ArrowLeft, Search, Layers, Home } from 'lucide-react';
import { societyService } from '../../../services/societyService';
import type { Tower } from '../../../types/society';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const TowerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSocietyId = 'soc-gvs';
  const [towers, setTowers] = useState<Tower[]>(societyService.getTowers(currentSocietyId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [towerName, setTowerName] = useState('');
  const [blockCode, setBlockCode] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(10);

  const refreshData = () => {
    setTowers(societyService.getTowers(currentSocietyId));
  };

  const handleCreateTower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!towerName || !blockCode) return;

    societyService.createTower(
      {
        societyId: currentSocietyId,
        name: towerName,
        blockCode: blockCode.toUpperCase(),
        totalFloors: Number(totalFloors),
        totalFlats: 0,
      },
      { id: 'sec-admin-1', name: 'Mayuri Udar', role: 'SOCIETY_ADMIN' }
    );

    refreshData();
    setIsAddModalOpen(false);
    setTowerName('');
    setBlockCode('');
  };

  const filteredTowers = towers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.blockCode.toLowerCase().includes(q);
  });

  const columns: Column<Tower>[] = [
    {
      key: 'blockCode',
      header: 'Block Code',
      width: '120px',
      render: (t) => (
        <span
          style={{
            background: 'var(--aarizo-card-blue, #F4FAFE)',
            color: 'var(--aarizo-navy, #083B56)',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '0.2rem 0.6rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.75rem',
          }}
        >
          Block {t.blockCode}
        </span>
      ),
    },
    { key: 'name', header: 'Tower Name', sortable: true },
    { key: 'totalFloors', header: 'Total Floors', sortable: true },
    { key: 'totalFlats', header: 'Total Flats', sortable: true },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, NGO & Staff tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--aarizo-card-blue, #F4FAFE)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: '1 1 auto' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aarizo-navy, #083B56)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
              Tower &amp; Building Structure
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Towers, blocks, and floor configurations
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '10px',
            background: 'var(--aarizo-coral, #F06543)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
          }}
        >
          <Plus size={15} /> Add Tower
        </button>
      </div>

      {/* ── Search Bar & Filter Strip ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '1rem 1rem 0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '12px',
            padding: '0 0.875rem',
            height: '46px',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
          }}
        >
          <Search size={18} color="var(--aarizo-text-secondary, #657785)" />
          <input
            type="text"
            placeholder="Search tower name or block code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: 'var(--aarizo-text, #203746)',
              background: 'transparent',
              minHeight: 'auto',
            }}
          />
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.25rem 1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {filteredTowers.length} towers &amp; blocks registered
        </span>
      </div>

      {/* ── Main Towers Roster Card / Table ── */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-4">
        {/* Quick Tower Cards Grid on Desktop/Tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTowers.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                borderRadius: '16px',
                padding: '1rem',
                boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'var(--aarizo-card-blue, #F4FAFE)',
                      border: '1px solid var(--aarizo-border, #DCE8EF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--aarizo-navy, #083B56)',
                      flexShrink: 0,
                    }}
                  >
                    <Building size={22} color="var(--aarizo-coral, #F06543)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
                      {t.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: 2 }}>
                      Block: <span style={{ fontWeight: 700, color: 'var(--aarizo-navy, #083B56)' }}>{t.blockCode}</span>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: 'var(--aarizo-navy, #083B56)',
                    background: 'var(--aarizo-card-blue, #F4FAFE)',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                  }}
                >
                  Block {t.blockCode}
                </span>
              </div>

              {/* Stats Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  paddingTop: '0.625rem',
                  borderTop: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} color="var(--aarizo-coral, #F06543)" />
                  <div>
                    <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontSize: '0.6875rem' }}>Floors</span>
                    <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{t.totalFloors} Floors</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Home size={15} color="#059669" />
                  <div>
                    <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontSize: '0.6875rem' }}>Flats</span>
                    <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{t.totalFlats} Units</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full DataTable Roster Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: '0 0 0.75rem 0' }}>
            All Registered Towers
          </h3>
          <DataTable
            columns={columns}
            data={filteredTowers}
            keyExtractor={(t) => t.id}
            pageSize={10}
            mobileRender={(t) => (
              <MobileDataCard
                title={t.name}
                subtitle={`Block: ${t.blockCode}`}
                attributes={[
                  { label: 'Floors', value: t.totalFloors },
                  { label: 'Flats', value: t.totalFlats }
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Modal: Register New Tower */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Tower"
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              form="register-tower-form"
              type="submit"
              style={{
                padding: '0.625rem 1.375rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #F06543 0%, #E05432 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(240, 101, 67, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              Save Tower
            </button>
          </div>
        }
      >
        <Form id="register-tower-form" onSubmit={handleCreateTower}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Tower Name">
              <input
                type="text"
                value={towerName}
                onChange={(e) => setTowerName(e.target.value)}
                placeholder="e.g. Majestic Heights"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              />
            </FormField>
            <FormField label="Block Code">
              <input
                type="text"
                value={blockCode}
                onChange={(e) => setBlockCode(e.target.value)}
                placeholder="e.g. A, B, T1"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              />
            </FormField>
          </div>
          <FormField label="Total Floors">
            <input
              type="number"
              value={totalFloors}
              onChange={(e) => setTotalFloors(Number(e.target.value))}
              min="1"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06543]"
            />
          </FormField>
        </Form>
      </Modal>
    </div>
  );
};
