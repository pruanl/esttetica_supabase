const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Dados de teste para pacientes
const patientsData = [
  {
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 99999-1111',
    birth_date: '1985-03-15',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    notes: 'Paciente regular, prefere horários pela manhã'
  },
  {
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 99999-2222',
    birth_date: '1990-07-22',
    address: 'Av. Paulista, 456 - São Paulo, SP',
    notes: 'Primeira consulta, indicação de amiga'
  },
  {
    name: 'Carla Oliveira',
    email: 'carla.oliveira@email.com',
    phone: '(11) 99999-3333',
    birth_date: '1988-12-10',
    address: 'Rua Augusta, 789 - São Paulo, SP',
    notes: 'Alérgica a alguns produtos, verificar antes dos procedimentos'
  },
  {
    name: 'Juliana Santos',
    email: 'juliana.santos@email.com',
    phone: '(11) 99999-4444',
    birth_date: '1992-05-18',
    address: 'Rua Oscar Freire, 321 - São Paulo, SP',
    notes: 'Cliente VIP, tratamentos mensais'
  },
  {
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(11) 99999-5555',
    birth_date: '1987-09-03',
    address: 'Alameda Santos, 654 - São Paulo, SP',
    notes: 'Prefere procedimentos mais naturais'
  },
  {
    name: 'Patricia Rocha',
    email: 'patricia.rocha@email.com',
    phone: '(11) 99999-6666',
    birth_date: '1983-11-25',
    address: 'Rua Consolação, 987 - São Paulo, SP',
    notes: 'Executiva, horários flexíveis após 18h'
  }
]

// Dados de teste para procedimentos
const proceduresData = [
  {
    name: 'Limpeza de Pele',
    description: 'Limpeza profunda com extração de cravos e hidratação',
    duration_minutes: 60,
    price: 120.00
  },
  {
    name: 'Peeling Químico',
    description: 'Renovação celular com ácidos para rejuvenescimento',
    duration_minutes: 45,
    price: 180.00
  },
  {
    name: 'Hidratação Facial',
    description: 'Tratamento hidratante intensivo para todos os tipos de pele',
    duration_minutes: 50,
    price: 100.00
  },
  {
    name: 'Microagulhamento',
    description: 'Estimulação do colágeno através de microagulhas',
    duration_minutes: 90,
    price: 250.00
  },
  {
    name: 'Radiofrequência',
    description: 'Tratamento para firmeza e rejuvenescimento da pele',
    duration_minutes: 75,
    price: 200.00
  },
  {
    name: 'Drenagem Linfática Facial',
    description: 'Massagem para redução de inchaço e melhora da circulação',
    duration_minutes: 40,
    price: 80.00
  },
  {
    name: 'Aplicação de Botox',
    description: 'Aplicação de toxina botulínica para rugas de expressão',
    duration_minutes: 30,
    price: 400.00
  },
  {
    name: 'Preenchimento com Ácido Hialurônico',
    description: 'Preenchimento de sulcos e aumento de volume',
    duration_minutes: 45,
    price: 600.00
  }
]

// Função para gerar agendamentos de teste
function generateAppointments(patients, procedures, userId) {
  const appointments = []
  const today = new Date()
  
  // Gerar agendamentos para os próximos 30 dias
  for (let i = 0; i < 15; i++) {
    const appointmentDate = new Date(today)
    appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 30))
    
    // Horários de trabalho: 9h às 18h
    const hour = 9 + Math.floor(Math.random() * 9)
    const minute = Math.random() < 0.5 ? 0 : 30
    appointmentDate.setHours(hour, minute, 0, 0)
    
    const randomPatient = patients[Math.floor(Math.random() * patients.length)]
    const randomProcedure = procedures[Math.floor(Math.random() * procedures.length)]
    
    appointments.push({
      user_id: userId,
      patient_id: randomPatient.id,
      procedure_id: randomProcedure.id,
      appointment_date: appointmentDate.toISOString(),
      duration_minutes: randomProcedure.duration_minutes,
      notes: Math.random() < 0.3 ? 'Observações do agendamento de teste' : null,
      status: Math.random() < 0.8 ? 'scheduled' : (Math.random() < 0.5 ? 'completed' : 'cancelled')
    })
  }
  
  return appointments
}

async function seedData() {
  try {
    console.log('🌱 Iniciando inserção de dados de teste...')
    
    // Obter o usuário atual (assumindo que já está logado)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Erro: Usuário não encontrado. Faça login primeiro.')
      return
    }
    
    console.log(`👤 Usuário encontrado: ${user.email}`)
    
    // 1. Inserir pacientes
    console.log('📝 Inserindo pacientes...')
    const { data: insertedPatients, error: patientsError } = await supabase
      .from('patients')
      .insert(patientsData.map(patient => ({ ...patient, user_id: user.id })))
      .select()
    
    if (patientsError) {
      console.error('❌ Erro ao inserir pacientes:', patientsError)
      return
    }
    
    console.log(`✅ ${insertedPatients.length} pacientes inseridos com sucesso!`)
    
    // 2. Inserir procedimentos
    console.log('💉 Inserindo procedimentos...')
    const { data: insertedProcedures, error: proceduresError } = await supabase
      .from('procedures')
      .insert(proceduresData.map(procedure => ({ ...procedure, user_id: user.id })))
      .select()
    
    if (proceduresError) {
      console.error('❌ Erro ao inserir procedimentos:', proceduresError)
      return
    }
    
    console.log(`✅ ${insertedProcedures.length} procedimentos inseridos com sucesso!`)
    
    // 3. Inserir agendamentos
    console.log('📅 Inserindo agendamentos...')
    const appointmentsData = generateAppointments(insertedPatients, insertedProcedures, user.id)
    
    const { data: insertedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .insert(appointmentsData)
      .select()
    
    if (appointmentsError) {
      console.error('❌ Erro ao inserir agendamentos:', appointmentsError)
      return
    }
    
    console.log(`✅ ${insertedAppointments.length} agendamentos inseridos com sucesso!`)
    
    console.log('\n🎉 Dados de teste inseridos com sucesso!')
    console.log('📊 Resumo:')
    console.log(`   • ${insertedPatients.length} pacientes`)
    console.log(`   • ${insertedProcedures.length} procedimentos`)
    console.log(`   • ${insertedAppointments.length} agendamentos`)
    console.log('\n🚀 Você pode agora testar o sistema com dados realistas!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar o script
seedData()