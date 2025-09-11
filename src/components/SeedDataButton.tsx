import { useState } from 'react'
import { Button } from './ui/button'
import { seedTestData, clearTestData } from '../utils/seedData'
import { Loader2, Database, Trash2 } from 'lucide-react'

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSeedData = async () => {
    setIsSeeding(true)
    setResult(null)
    
    try {
      const seedResult = await seedTestData()
      setResult(seedResult)
    } catch (error) {
      console.error('Erro ao inserir dados:', error)
      alert('Erro ao inserir dados de teste. Verifique o console para mais detalhes.')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados de teste? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setIsClearing(true)
    setResult(null)
    
    try {
      await clearTestData()
      alert('Dados de teste removidos com sucesso!')
    } catch (error) {
      console.error('Erro ao limpar dados:', error)
      alert('Erro ao limpar dados de teste. Verifique o console para mais detalhes.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Database className="h-5 w-5" />
        Dados de Teste
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Use os botões abaixo para popular o sistema com dados de teste ou limpar todos os dados.
      </p>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={handleSeedData} 
          disabled={isSeeding || isClearing}
          className="flex items-center gap-2"
        >
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Inserindo...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Gerar Dados de Teste
            </>
          )}
        </Button>
        
        <Button 
          variant="destructive"
          onClick={handleClearData} 
          disabled={isSeeding || isClearing}
          className="flex items-center gap-2"
        >
          {isClearing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Limpando...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Limpar Dados
            </>
          )}
        </Button>
      </div>
      
      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
          <p className="font-medium text-green-800 mb-1">✅ Dados inseridos com sucesso!</p>
          <ul className="text-green-700 space-y-1">
            <li>• {result.patients} pacientes</li>
            <li>• {result.procedures} procedimentos</li>
            <li>• {result.appointments} agendamentos</li>
          </ul>
        </div>
      )}
    </div>
  )
}