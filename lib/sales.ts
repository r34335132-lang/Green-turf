import { supabase } from "@/lib/supabase";
import { normalizeMexicanPhone } from "@/lib/phone";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  customer_status?: string | null;
  quotation_image_url?: string | null;
  assigned_to?: string | null;
  created_at: string;
};

export type SaleItemInput = {
  product_id: string | null;
  item_type: "producto" | "servicio";
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
};

export type Sale = {
  id: string;
  folio: string;
  customer_id: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  applies_iva: boolean;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  customers?: Pick<Customer, "id" | "name" | "phone" | "email"> | null;
  sale_items?: Array<SaleItemInput & { id: string; line_total: number }>;
  sale_expenses?: SaleExpense[];
  sale_payments?: SalePayment[];
};

export type SaleExpense = {
  id: string;
  sale_id: string;
  category: string;
  description: string | null;
  amount: number;
  created_at: string;
};

export type SalePayment = {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

export type SalesSummary = {
  today: number;
  week: number;
  month: number;
  pending: number;
  profit: number;
};

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as Customer[]) || [];
}

export async function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  customer_status?: string;
  quotation_image_url?: string | null;
}): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name.trim(),
      phone: input.phone ? normalizeMexicanPhone(input.phone) : null,
      email: input.email?.trim().toLowerCase() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      customer_status: input.customer_status || "cotizando",
      quotation_image_url: input.quotation_image_url || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, input: Partial<Customer>): Promise<void> {
  const payload = {
    ...input,
    phone: input.phone ? normalizeMexicanPhone(input.phone) : input.phone,
    email: input.email?.trim().toLowerCase() || input.email,
  };
  const { error } = await supabase.from("customers").update(payload).eq("id", id);
  if (error) throw error;
}

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*, customers(id, name, phone, email), sale_items(*), sale_expenses(*), sale_payments(*)")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Sale[]) || [];
}

export async function getCustomerSales(customerId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*), sale_payments(*)")
    .eq("customer_id", customerId)
    .order("sale_date", { ascending: false });
  if (error) throw error;
  return (data as Sale[]) || [];
}

export async function createSale(input: {
  customer_id: string;
  sale_date: string;
  discount: number;
  applies_iva: boolean;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  notes: string;
  items: SaleItemInput[];
}): Promise<string> {
  const folio = `VT-${input.sale_date.replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase.rpc("create_sale_with_items", {
    sale_payload: {
      folio,
      customer_id: input.customer_id,
      sale_date: input.sale_date,
      discount: input.discount,
      applies_iva: input.applies_iva,
      tax_rate: input.applies_iva ? 0.16 : 0,
      payment_method: input.payment_method,
      payment_status: input.payment_status,
      amount_paid: input.amount_paid,
      notes: input.notes,
    },
    items_payload: input.items,
  });
  if (error) throw error;
  return data as string;
}

export async function addSalePayment(
  saleId: string,
  input: { amount: number; payment_method: string; payment_date: string; notes?: string | null }
): Promise<void> {
  const { error } = await supabase.rpc("add_sale_payment", {
    target_sale_id: saleId,
    payment_amount: input.amount,
    payment_method_value: input.payment_method,
    payment_date_value: input.payment_date,
    payment_notes: input.notes?.trim() || null,
  });
  if (error) throw error;
}

export async function addSaleExpense(
  saleId: string,
  input: { category: string; amount: number; description?: string }
): Promise<void> {
  const { error } = await supabase.from("sale_expenses").insert({
    sale_id: saleId,
    category: input.category,
    amount: input.amount,
    description: input.description?.trim() || null,
  });
  if (error) throw error;
}

export function saleExpenseTotal(sale: Pick<Sale, "sale_expenses">): number {
  return (sale.sale_expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export function saleProfit(sale: Pick<Sale, "total" | "sale_expenses">): number {
  return Number(sale.total || 0) - saleExpenseTotal(sale);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function summarizeSales(sales: Sale[]): SalesSummary {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);
  const monthPrefix = today.slice(0, 7);
  return sales.reduce<SalesSummary>(
    (summary, sale) => {
      const total = Number(sale.total || 0);
      if (sale.sale_date === today) summary.today += total;
      if (new Date(`${sale.sale_date}T00:00:00`) >= weekStart) summary.week += total;
      if (sale.sale_date.startsWith(monthPrefix)) summary.month += total;
      summary.pending += Math.max(0, total - Number(sale.amount_paid || 0));
      summary.profit += saleProfit(sale);
      return summary;
    },
    { today: 0, week: 0, month: 0, pending: 0, profit: 0 }
  );
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}
