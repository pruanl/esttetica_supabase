import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { PatientForm } from '../components/PatientForm';
import { patientsService } from '../services/patientsService';
import type { Patient } from '../types/database';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsService.getPatients();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await loadPatients();
    setShowForm(false);
    setEditingPatient(null);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDelete = async (patient: Patient) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente "${patient.name}"?`)) {
      try {
        await patientsService.deletePatient(patient.id);
        await loadPatients();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir paciente');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <PatientForm
          patient={editingPatient || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Pacientes</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? 'Novo' : 'Novo Paciente'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar pacientes por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Carregando pacientes...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado ainda.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowForm(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              {isMobile ? 'Novo' : 'Cadastrar Primeiro Paciente'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    {patient.birth_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {calculateAge(patient.birth_date)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(patient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(patient)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {patient.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-2" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-2" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        Alergias
                      </Badge>
                    </div>
                  )}
                  {patient.medical_history && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Histórico Médico
                      </Badge>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {patient.notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400">
                    Cadastrado em {formatDate(patient.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}