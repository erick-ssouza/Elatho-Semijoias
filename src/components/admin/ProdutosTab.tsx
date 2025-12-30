import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Images } from "lucide-react";
import MultiImageUpload from "./MultiImageUpload";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  categoria: string;
  imagem_url: string | null;
  imagens: string[] | null;
  estoque: number | null;
  destaque: boolean | null;
  variacoes: unknown;
}

const categorias = [
  { value: "aneis", label: "Anéis" },
  { value: "brincos", label: "Brincos" },
  { value: "colares", label: "Colares" },
  { value: "pulseiras", label: "Pulseiras" },
  { value: "conjuntos", label: "Conjuntos" },
];

const tiposMaterial = [
  { value: "ouro18k", label: "Banho de Ouro 18k", descricao: "Material: Liga metálica com banho de ouro 18k\nGarantia: 12 meses contra defeitos" },
  { value: "prata925", label: "Banho de Prata 925", descricao: "Material: Liga metálica com banho de prata 925\nGarantia: 12 meses contra defeitos" },
  { value: "ouro18k_zirconias", label: "Banho de Ouro 18k com Zircônias", descricao: "Material: Liga metálica com banho de ouro 18k\nPedras: Zircônias de alta qualidade\nGarantia: 12 meses contra defeitos" },
  { value: "prata925_zirconias", label: "Banho de Prata 925 com Zircônias", descricao: "Material: Liga metálica com banho de prata 925\nPedras: Zircônias de alta qualidade\nGarantia: 12 meses contra defeitos" },
  { value: "ouro_rose", label: "Banho de Ouro Rosé", descricao: "Material: Liga metálica com banho de ouro rosé\nGarantia: 12 meses contra defeitos" },
  { value: "ouro_rose_zirconias", label: "Banho de Ouro Rosé com Zircônias", descricao: "Material: Liga metálica com banho de ouro rosé\nPedras: Zircônias de alta qualidade\nGarantia: 12 meses contra defeitos" },
  { value: "ouro18k_perolas", label: "Banho de Ouro 18k com Pérolas", descricao: "Material: Liga metálica com banho de ouro 18k\nPedras: Pérolas sintéticas de alta qualidade\nGarantia: 12 meses contra defeitos" },
  { value: "prata925_perolas", label: "Banho de Prata 925 com Pérolas", descricao: "Material: Liga metálica com banho de prata 925\nPedras: Pérolas sintéticas de alta qualidade\nGarantia: 12 meses contra defeitos" },
];

const getCategoriaLabel = (value: string) => {
  const cat = categorias.find(c => c.value === value);
  return cat ? cat.label : value;
};

const ProdutosTab = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoAdicional: "",
    tipoMaterial: "",
    preco: "",
    preco_promocional: "",
    categoria: "",
    imagem_url: "",
    imagens: [] as string[],
    estoque: "10",
    destaque: false,
    variacoes: "Dourado, Prateado, Rosé",
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Cast imagens to string array
      const produtosFormatted = (data || []).map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens as string[] : null
      })) as Produto[];
      
      setProdutos(produtosFormatted);
    } catch (error) {
      console.error("Error fetching produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      descricao: "",
      descricaoAdicional: "",
      tipoMaterial: "",
      preco: "",
      preco_promocional: "",
      categoria: "",
      imagem_url: "",
      imagens: [],
      estoque: "10",
      destaque: false,
      variacoes: "Dourado, Prateado, Rosé",
    });
    setEditingProduto(null);
  };

  const handleMaterialChange = (value: string) => {
    const material = tiposMaterial.find(t => t.value === value);
    if (material) {
      setForm(prev => ({
        ...prev,
        tipoMaterial: value,
        descricao: material.descricao + (prev.descricaoAdicional ? '\n' + prev.descricaoAdicional : ''),
      }));
    } else {
      setForm(prev => ({ ...prev, tipoMaterial: value }));
    }
  };

  const handleDescricaoAdicionalChange = (value: string) => {
    const material = tiposMaterial.find(t => t.value === form.tipoMaterial);
    const baseDescricao = material ? material.descricao : '';
    setForm(prev => ({
      ...prev,
      descricaoAdicional: value,
      descricao: baseDescricao + (value ? '\n' + value : ''),
    }));
  };

  const openEdit = (produto: Produto) => {
    setEditingProduto(produto);
    
    // Try to detect material type from description
    let tipoMaterial = "";
    let descricaoAdicional = "";
    
    if (produto.descricao) {
      const matchingMaterial = tiposMaterial.find(t => produto.descricao?.startsWith(t.descricao.split('\n')[0]));
      if (matchingMaterial) {
        tipoMaterial = matchingMaterial.value;
        const standardDesc = matchingMaterial.descricao;
        if (produto.descricao.length > standardDesc.length) {
          descricaoAdicional = produto.descricao.slice(standardDesc.length).trim();
          if (descricaoAdicional.startsWith('\n')) {
            descricaoAdicional = descricaoAdicional.slice(1);
          }
        }
      } else {
        descricaoAdicional = produto.descricao;
      }
    }
    
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || "",
      descricaoAdicional,
      tipoMaterial,
      preco: String(produto.preco),
      preco_promocional: produto.preco_promocional ? String(produto.preco_promocional) : "",
      categoria: produto.categoria,
      imagem_url: produto.imagem_url || "",
      imagens: Array.isArray(produto.imagens) ? produto.imagens : [],
      estoque: String(produto.estoque || 10),
      destaque: produto.destaque || false,
      variacoes: (Array.isArray(produto.variacoes) ? produto.variacoes : []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const variacoesArray = form.variacoes
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    // Garantir que categoria está em minúsculas sem acento
    const categoriaValue = form.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    console.log("Categoria selecionada:", form.categoria);
    console.log("Categoria normalizada:", categoriaValue);

    const produtoData = {
      nome: form.nome,
      descricao: form.descricao || null,
      preco: parseFloat(form.preco),
      preco_promocional: form.preco_promocional ? parseFloat(form.preco_promocional) : null,
      categoria: categoriaValue,
      imagem_url: form.imagem_url || null,
      imagens: form.imagens.length > 0 ? form.imagens : null,
      estoque: parseInt(form.estoque),
      destaque: form.destaque,
      variacoes: variacoesArray,
    };

    try {
      if (editingProduto) {
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingProduto.id);
        if (error) throw error;
        toast({ title: "Produto atualizado!" });
      } else {
        const { error } = await supabase.from("produtos").insert(produtoData);
        if (error) throw error;
        toast({ title: "Produto criado!" });
      }

      fetchProdutos();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro ao salvar produto", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDestaque = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("produtos")
        .update({ destaque: !currentValue })
        .eq("id", id);
      if (error) throw error;
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, destaque: !currentValue } : p))
      );
    } catch (error) {
      toast({ title: "Erro ao atualizar destaque", variant: "destructive" });
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Produto excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir produto", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Produtos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoMaterial">Tipo de Material</Label>
                <Select value={form.tipoMaterial} onValueChange={handleMaterialChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de material" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposMaterial.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricaoAdicional">Descrição Adicional (opcional)</Label>
                <Textarea
                  id="descricaoAdicional"
                  value={form.descricaoAdicional}
                  onChange={(e) => handleDescricaoAdicionalChange(e.target.value)}
                  rows={2}
                  placeholder="Informações adicionais sobre o produto..."
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição Final (gerada automaticamente)</Label>
                <Textarea
                  value={form.descricao}
                  readOnly
                  rows={3}
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_promocional">Preço Promocional</Label>
                  <Input
                    id="preco_promocional"
                    type="number"
                    step="0.01"
                    value={form.preco_promocional}
                    onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque">Estoque</Label>
                  <Input
                    id="estoque"
                    type="number"
                    value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  Imagens do Produto (até 5)
                </Label>
                <MultiImageUpload
                  mainImage={form.imagem_url}
                  additionalImages={form.imagens}
                  onMainImageChange={(url) => setForm({ ...form, imagem_url: url })}
                  onAdditionalImagesChange={(urls) => setForm({ ...form, imagens: urls })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variacoes">Variações (separadas por vírgula)</Label>
                <Input
                  id="variacoes"
                  value={form.variacoes}
                  onChange={(e) => setForm({ ...form, variacoes: e.target.value })}
                  placeholder="Dourado, Prateado, Rosé"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="destaque"
                  checked={form.destaque}
                  onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                />
                <Label htmlFor="destaque">Produto em destaque (aparece na home)</Label>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduto ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <img
                        src={produto.imagem_url || "/placeholder.svg"}
                        alt={produto.nome}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{getCategoriaLabel(produto.categoria)}</TableCell>
                    <TableCell>
                      {produto.preco_promocional ? (
                        <div>
                          <span className="line-through text-muted-foreground text-sm">
                            R$ {Number(produto.preco).toFixed(2)}
                          </span>
                          <br />
                          <span className="text-green-600 font-medium">
                            R$ {Number(produto.preco_promocional).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span>R$ {Number(produto.preco).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>{produto.estoque}</TableCell>
                    <TableCell>
                      <Switch
                        checked={produto.destaque || false}
                        onCheckedChange={() => toggleDestaque(produto.id, produto.destaque || false)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(produto)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProduto(produto.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProdutosTab;
