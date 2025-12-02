# 🔍 Mapeamento de Campos - Tabela `fichas`

## ✅ Estrutura Real da Tabela `fichas` no Supabase

```
Campos disponíveis:
- id
- titulo ✅
- resumo ✅
- conteudo ✅
- tipo ✅
- tags
- aparece_em
- ano_diegese
- data_inicio
- data_fim
- granularidade_data
- camada_temporal
- descricao_data
- world_id ✅
- imagem_url
- codigo
- slug
- episodio ✅ (campo para número do episódio!)
- created_at
- updated_at
- user_id ✅
- album_imagens
```

---

## ❌ Campos que o Código Estava Tentando Usar (INCORRETOS)

### EpisodeModal (antes da correção):
```javascript
{
  id,
  world_id,          // ✅ OK
  universe_id,       // ❌ NÃO EXISTE na tabela!
  tipo,              // ✅ OK
  numero_episodio,   // ❌ ERRADO - campo correto é "episodio"
  titulo,            // ✅ OK
  logline,           // ❌ NÃO EXISTE - deve usar "conteudo"
  resumo             // ✅ OK
}
```

---

## ✅ Mapeamento Correto - Modal de Episódio

| Campo no Modal | Campo na Tabela `fichas` | Observação |
|----------------|--------------------------|------------|
| Número do Episódio | `episodio` | integer |
| Título | `titulo` | text |
| Logline | `conteudo` | text |
| Sinopse | `resumo` | text |
| Mundo | `world_id` | uuid |
| Tipo | `tipo` | text ("episodio") |
| Usuário | `user_id` | uuid (automático) |

---

## 🚨 Problemas Identificados

### 1. Campo `universe_id` NÃO EXISTE
- ❌ Código tentava enviar `universe_id`
- ✅ Tabela `fichas` **NÃO TEM** esse campo
- 🔧 Solução: Remover `universe_id` do insert

### 2. Campo `numero_episodio` vs `episodio`
- ❌ Código usava `numero_episodio`
- ✅ Tabela tem `episodio`
- 🔧 Solução: Usar `episodio` ao invés de `numero_episodio`

### 3. Campo `logline` não existe
- ❌ Código tentava enviar `logline`
- ✅ Deve usar `conteudo`
- 🔧 Solução: Mapear logline → conteudo

---

## ✅ Código Correto para EpisodeModal

```javascript
const episodeData = {
  id: episode?.id,
  world_id: worldId,           // ✅ OK
  tipo: "episodio",             // ✅ OK
  episodio: parseInt(numeroEpisodio),  // ✅ Corrigido
  titulo: titulo.trim(),        // ✅ OK
  conteudo: logline.trim(),     // ✅ Corrigido (era "logline")
  resumo: sinopse.trim(),       // ✅ OK
  // universe_id: REMOVIDO - não existe na tabela
};
```

---

## ✅ Código Correto para API `/api/fichas`

```javascript
const insertData = {
  world_id: fichaData.world_id,
  tipo: fichaData.tipo,
  episodio: fichaData.episodio,  // ✅ Corrigido
  titulo: fichaData.titulo,
  conteudo: fichaData.conteudo,  // ✅ Corrigido
  resumo: fichaData.resumo,
  user_id: user.id
  // universe_id: REMOVIDO
};
```
