# CRMAppy — Processo de Deploy
### As versões apresentadas aqui são apenas exemplos


## Repositórios

| Repo | Finalidade |
|------|-----------|
| `crmappy-vnnnn` | Desenvolvimento ativo exemplo crmappy-0102 |
| `crmappy-prod` | Produção — Netlify aponta sempre para `main` |

**Remotes configurados em `crmappy-v0102`:**
- `origin` → `crmappy-v0102` (desenvolvimento)
- `prod` → `crmappy-prod` (produção)

---

## Fluxo de Deploy

### 1. Pré-deploy — atualizar versão

Obter SHA do último commit:
```bash
git rev-parse --short HEAD
```

Editar manualmente `src/components/AppVersion.tsx`:
```typescript
const APP_VERSION = 'vXXXX';   // ex: v0103
const BUILD_DATE = 'DDMM';     // ex: 3003
const GIT_SHA = 'xxxxxxx';     // SHA obtido acima
```

### 2. Commit final
```bash
git add -A
git commit -m "chore: update AppVersion to <SHA>"
git push origin <branch-atual>
```

### 3. Deploy (script automático)
```bash
cd ~/projetos/crmappy-v0102
deploy_crmappy
```

O script executa em sequência:
1. Build local — se falhar, **aborta**
2. Push para `preview` → Netlify gera URL de preview
3. Aguarda confirmação manual **(s/n)**
4. Se `s` → push para `main` → produção atualiza automaticamente
5. Se `n` → deploy cancelado, produção intacta

### 4. Validação em produção
- Acessar https://cognosone.pro/crmappy
- Confirmar rodapé: `CRMAppy vXXXXmDDMM · <SHA>`
- Testar fluxos críticos: login, cockpit, agenda
- Se OK → versão **congelada** — nenhuma alteração após validação

---

## Rollback

No Netlify → **Deploys** → clicar no último deploy **Published** anterior → **Publish deploy**

---

## Nova versão

1. Criar repo `crmappy-v0103` no GitHub (`liparelli-stack`, privado)
2. Copiar codebase: `cp -r ~/projetos/crmappy-v0102 ~/projetos/crmappy-v0103`
3. Atualizar remote: `git remote set-url origin https://github.com/liparelli-stack/crmappy-v0103.git`
4. Adicionar remote prod: `git remote add prod https://github.com/liparelli-stack/crmappy-prod.git`
5. Criar branch: `git checkout -b crmappy-v0103`
6. Repetir o ciclo

---

## Regras

- ⛔ Nunca alterar uma versão após deploy validado em produção
- ⛔ Nunca fazer push direto para `prod/main` sem passar pelo script
- ✅ Sempre validar o preview antes de confirmar promoção para produção
- ✅ Sempre atualizar `AppVersion.tsx` antes do deploy
