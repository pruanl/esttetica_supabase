import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientsService } from '@/services/patientsService';
import type { Patient } from '@/types/database';
import { Calendar, Gift } from 'lucide-react';

interface BirthdayPatient {
  id: string;
  name: string;
  birth_date: string;
  daysUntilBirthday: number;
}

const BirthdayWidget: React.FC = () => {
  const [birthdayPatients, setBirthdayPatients] = useState<BirthdayPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBirthdayPatients();
  }, []);

  const fetchBirthdayPatients = async () => {
    try {
      setLoading(true);
      const patients = await patientsService.getPatients();
      
      const patientsWithBirthdays = patients.filter((patient: Patient) => patient.birth_date);
      const upcomingBirthdays = filterUpcomingBirthdays(patientsWithBirthdays);
      
      setBirthdayPatients(upcomingBirthdays);
    } catch (err) {
      console.error('Erro ao buscar aniversariantes:', err);
      setError('Erro ao carregar aniversariantes');
    } finally {
      setLoading(false);
    }
  };

  const filterUpcomingBirthdays = (patients: Patient[]): BirthdayPatient[] => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return patients
      .map((patient: Patient) => {
        const birthDate = new Date(patient.birth_date!);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );
        
        // Se o aniversário já passou este ano, considerar o próximo ano
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const timeDiff = thisYearBirthday.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        return {
          id: patient.id,
          name: patient.name,
          birth_date: patient.birth_date!,
          daysUntilBirthday: daysDiff
        };
      })
      .filter(patient => patient.daysUntilBirthday >= 0 && patient.daysUntilBirthday <= 7)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  };

  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getBirthdayMessage = (daysUntil: number) => {
    if (daysUntil === 0) return 'Hoje!';
    if (daysUntil === 1) return 'Amanhã';
    return `Em ${daysUntil} dias`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Aniversariantes da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Aniversariantes da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Aniversariantes da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdayPatients.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhuma aniversariante na próxima semana.
          </div>
        ) : (
          <div className="space-y-3">
            {birthdayPatients.map(patient => (
              <div key={patient.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{patient.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {formatBirthDate(patient.birth_date)}
                  </div>
                  <div className="text-xs font-medium text-primary">
                    {getBirthdayMessage(patient.daysUntilBirthday)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdayWidget;