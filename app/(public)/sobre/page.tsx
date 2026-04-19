export default function SobrePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Sobre a Arch Platform</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Somos uma plataforma SaaS criada para modernizar a indústria da arquitetura,
          conectando profissionais, clientes e fornecedores em um ecossistema digital integrado.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Nossa missão</h2>
        <p className="text-muted-foreground">
          Facilitar a gestão de projetos arquitetônicos, eliminando a burocracia e melhorando
          a comunicação entre todos os envolvidos no processo construtivo.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Valores</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Transparência em todas as etapas do projeto</li>
          <li>Eficiência na comunicação e gestão</li>
          <li>Inovação contínua para o setor</li>
          <li>Compromisso com a qualidade</li>
        </ul>
      </div>
    </div>
  )
}
