import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminShell } from "@/components/admin/AdminShell";
import { EventCard } from "@/components/admin/EventCard";
import { AdminEvent, useAdminEvents } from "@/hooks/useAdminEvents";
import { useColors } from "@/hooks/useColors";
import { AddButton, EditorModal, EmptyState, ErrorState, Input, Label, SaveButton } from "@/app/admin/notes";

LocaleConfig.locales.es = {
  monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const TYPES = ["Instalación", "Visita", "Cotización", "Entrega", "Compra", "Recordatorio"];
const STATUSES = ["pendiente", "confirmado", "terminado", "cancelado"];
const today = new Date().toISOString().slice(0, 10);

export default function AdminCalendarScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ create?: string }>();
  const { events, loading, error, save, remove } = useAdminEvents();
  const [selectedDate, setSelectedDate] = useState(today);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("Instalación");
  const [status, setStatus] = useState("pendiente");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const open = (event?: AdminEvent) => {
    setEditing(event || null);
    setTitle(event?.title || "");
    setDescription(event?.description || "");
    setSelectedDate(event?.event_date || selectedDate);
    setEventTime(event?.event_time?.slice(0, 5) || "");
    setEventType(event?.event_type || "Instalación");
    setStatus(event?.status || "pendiente");
    setClientName(event?.client_name || "");
    setClientPhone(event?.client_phone || "");
    setModal(true);
  };

  useEffect(() => {
    if (params.create === "1") open();
  }, [params.create]);

  const selectedEvents = events.filter((event) => event.event_date === selectedDate);
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    events.forEach((event) => {
      marks[event.event_date] = { marked: true, dotColor: colors.primary };
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: colors.primary, selectedTextColor: "#071000" };
    return marks;
  }, [colors.primary, events, selectedDate]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await save({
        title: title.trim(),
        description: description.trim() || null,
        event_date: selectedDate,
        event_time: eventTime.trim() || null,
        event_type: eventType,
        status,
        client_name: clientName.trim() || null,
        client_phone: clientPhone.trim() || null,
      }, editing?.id);
      setModal(false);
    } catch (e: any) {
      Alert.alert("No se pudo guardar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Calendario" subtitle="Instalaciones, visitas, entregas y recordatorios del equipo." action={<AddButton onPress={() => open()} />}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <ErrorState message="Falta activar admin_events. Ejecuta la migración del panel." /> : null}
        <View style={styles.layout}>
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                calendarBackground: colors.card,
                monthTextColor: colors.foreground,
                dayTextColor: colors.foreground,
                textDisabledColor: colors.mutedForeground + "55",
                arrowColor: colors.primary,
                todayTextColor: colors.primary,
                textMonthFontFamily: "Inter_700Bold",
                textDayFontFamily: "Inter_500Medium",
                textDayHeaderFontFamily: "Inter_600SemiBold",
              }}
            />
          </View>
          <View style={[styles.events, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>Eventos del {selectedDate.split("-").reverse().join("/")}</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} onEdit={() => open(event)} onDelete={() => Alert.alert("Eliminar evento", "¿Deseas eliminarlo?", [{ text: "Cancelar" }, { text: "Eliminar", style: "destructive", onPress: () => remove(event.id) }])} />
            ))}
            {!loading && !selectedEvents.length ? <EmptyState icon="calendar" title="Día disponible" text="No hay eventos programados para esta fecha." /> : null}
          </View>
        </View>
      </ScrollView>
      <EditorModal visible={modal} onClose={() => setModal(false)} title={editing ? "Editar evento" : "Nuevo evento"}>
        <Label text="Título *" /><Input value={title} onChangeText={setTitle} placeholder="Ej. Instalación residencial" />
        <Label text="Descripción" /><Input value={description} onChangeText={setDescription} multiline placeholder="Detalles y acuerdos..." />
        <View style={styles.two}><View style={styles.flex}><Label text="Fecha (AAAA-MM-DD)" /><Input value={selectedDate} onChangeText={setSelectedDate} /></View><View style={styles.flex}><Label text="Hora (HH:MM)" /><Input value={eventTime} onChangeText={setEventTime} placeholder="09:30" /></View></View>
        <Choice label="Tipo" values={TYPES} selected={eventType} onSelect={setEventType} />
        <Choice label="Estado" values={STATUSES} selected={status} onSelect={setStatus} />
        <Label text="Cliente relacionado" /><Input value={clientName} onChangeText={setClientName} placeholder="Nombre (opcional)" />
        <Label text="Teléfono" /><Input value={clientPhone} onChangeText={setClientPhone} placeholder="Teléfono (opcional)" />
        <SaveButton label="Guardar evento" saving={saving} disabled={!title.trim() || !selectedDate} onPress={submit} />
      </EditorModal>
    </AdminShell>
  );
}

function Choice({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  const colors = useColors();
  return <View style={{ marginBottom: 14 }}><Label text={label} /><View style={styles.choices}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.choice, { borderColor: selected === value ? colors.primary : colors.border, backgroundColor: selected === value ? colors.primary + "18" : "transparent" }]}><Text style={[styles.choiceText, { color: selected === value ? colors.primary : colors.mutedForeground }]}>{value}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1300, width: "100%", alignSelf: "center" },
  layout: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-start" },
  calendarCard: { minWidth: 300, flex: 1, borderRadius: 18, borderWidth: 1, padding: 6, overflow: "hidden" },
  events: { minWidth: 300, flex: 1, borderRadius: 18, borderWidth: 1, padding: 16 },
  dayTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 14 },
  two: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  choiceText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
});

