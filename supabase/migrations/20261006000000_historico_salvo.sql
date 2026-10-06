-- "Minhas Leituras" agora mostra SÓ as leituras que a pessoa salvou (apertou Salvar).
-- Toda leitura continua registrada (pros dados de conversão via tipo_acesso), mas com
-- salvo=false; o botão Salvar marca salvo=true. Também corrige o vazamento de histórico
-- entre contas: o app passa a ler só a nuvem filtrada por user_id (nada de histórico local).
-- Projeto: Psiquê Oráculo 🔮

ALTER TABLE public.historico_leituras ADD COLUMN IF NOT EXISTS salvo BOOLEAN NOT NULL DEFAULT false;

-- Faltavam políticas de UPDATE e DELETE (só havia SELECT e INSERT). Sem elas, o botão
-- "Salvar" (marcar salvo=true) e o "excluir leitura do histórico" eram bloqueados pelo RLS.
-- Permite a pessoa atualizar/excluir SOMENTE as próprias leituras.
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias leituras" ON public.historico_leituras;
CREATE POLICY "Usuários podem atualizar suas próprias leituras"
ON public.historico_leituras FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir suas próprias leituras" ON public.historico_leituras;
CREATE POLICY "Usuários podem excluir suas próprias leituras"
ON public.historico_leituras FOR DELETE
USING (auth.uid() = user_id);

-- Recarrega o cache do PostgREST.
NOTIFY pgrst, 'reload schema';
