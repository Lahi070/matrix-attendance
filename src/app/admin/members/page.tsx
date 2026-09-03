'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [epf, setEpf] = useState('');
  const [gender, setGender] = useState('Female');
  const [role, setRole] = useState('Team Member');
  const [moduleId, setModuleId] = useState('');

  const fetchData = async () => {
    const { data: modData } = await supabase.from('modules').select('id, name').order('name');
    if (modData) setModules(modData);
    
    const { data: memData } = await supabase.from('team_members').select('*, modules(name)').order('name');
    if (memData) setMembers(memData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !epf || !moduleId) return;
    
    const { error } = await supabase.from('team_members').insert([
      { name, epf, gender, role, module_id: moduleId }
    ]);
    
    if (!error) {
      setName(''); setEpf('');
      fetchData();
    } else {
      alert(error.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Members</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
        <h2 className="font-bold mb-4">Add New Member</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input type="text" className="w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">EPF</label>
            <input type="text" className="w-full border rounded p-2" value={epf} onChange={e => setEpf(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Gender</label>
            <select className="w-full border rounded p-2" value={gender} onChange={e => setGender(e.target.value)}>
              <option>Female</option>
              <option>Male</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <select className="w-full border rounded p-2" value={role} onChange={e => setRole(e.target.value)}>
              <option>Team Member</option>
              <option>Group Leader</option>
              <option>Mender</option>
              <option>Team Leader</option>
              <option>Indirect</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Module</label>
            <select className="w-full border rounded p-2" value={moduleId} onChange={e => setModuleId(e.target.value)} required>
              <option value="">Select...</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 lg:col-span-6 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">Add Member</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">EPF</th>
              <th className="p-4">Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Module</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{m.epf}</td>
                <td className="p-4 font-medium">{m.name}</td>
                <td className="p-4 text-gray-600">{m.role}</td>
                <td className="p-4">{m.modules?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
