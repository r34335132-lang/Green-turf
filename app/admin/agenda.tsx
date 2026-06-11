import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';

// Configuración opcional para español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  // ESTADOS ESTRICTOS (Garantizamos que siempre inician como string)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteDesc, setNoteDesc] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // VARIABLES BLINDADAS CONTRA EL ERROR DE ".trim() of undefined"
  const safeTitle = noteTitle || '';
  const safeDesc = noteDesc || '';
  const isSaveDisabled = saving || safeTitle.trim() === '';

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log('Permisos de notificación denegados');
    })();
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase.from('agenda_notes').select('*').order('created_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    notes.forEach(note => {
      marks[note.date_string] = { marked: true, dotColor: colors.primary };
    });
    
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary, selectedTextColor: '#000' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary, selectedTextColor: '#000' };
    }
    return marks;
  }, [notes, selectedDate, colors]);

  const selectedNotes = useMemo(() => {
    return notes.filter(n => n.date_string === selectedDate);
  }, [notes, selectedDate]);

  const scheduleReminder = async (title: string, desc: string, dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, 9, 0, 0);

    if (triggerDate.getTime() < Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📌 Pendiente hoy: ${title}`,
        body: desc || 'Revisa tu agenda para más detalles.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  };

  const handleAddNote = () => {
    setEditingId(null);
    setNoteTitle('');
    setNoteDesc('');
    setModalVisible(true);
  };

  const handleEditNote = (note: any) => {
    setEditingId(note.id);
    setNoteTitle(note.title || ''); 
    setNoteDesc(note.description || '');
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (safeTitle.trim() === '') return;
    setSaving(true);
    
    if (editingId) {
      await supabase.from('agenda_notes').update({
        title: safeTitle.trim(),
        description: safeDesc.trim()
      }).eq('id', editingId);
    } else {
      await supabase.from('agenda_notes').insert([
        { date_string: selectedDate, title: safeTitle.trim(), description: safeDesc.trim() }
      ]);
      await scheduleReminder(safeTitle.trim(), safeDesc.trim(), selectedDate);
    }
    
    setModalVisible(false);
    setSaving(false);
    fetchNotes();
  };

  const deleteNote = (id: string) => {
    Alert.alert("Eliminar", "¿Estás seguro de borrar este pendiente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: async () => {
          await supabase.from('agenda_notes').delete().eq('id', id);
          fetchNotes();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      onPress={() => handleEditNote(item)}
      style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
             <Feather name="file-text" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title || item.name || 'Sin título'}</Text>
        </View>
        <Pressable onPress={() => deleteNote(item.id)} style={styles.deleteBtn}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </Pressable>
      </View>
      {item.description ? (
        <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderEmptyDate = () => (
    <View style={[styles.emptyContainer]}>
      <Feather name="coffee" size={40} color={colors.border} style={{ marginBottom: 12 }} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Día libre de pendientes</Text>
      <Pressable 
        onPress={handleAddNote}
        style={[styles.emptyBtn, { borderColor: colors.primary }]}
      >
        <Text style={[styles.emptyBtnText, { color: colors.primary }]}>+ Agregar tarea</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tu Agenda</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Organiza tus pendientes diarios
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.calendarWrapper}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          style={[styles.calendarObj, { borderColor: colors.border }]}
          theme={{
            calendarBackground: colors.card,
            monthTextColor: colors.foreground,
            textMonthFontFamily: 'Inter_700Bold',
            textMonthFontSize: 16,
            dayTextColor: colors.foreground,
            textDayFontFamily: 'Inter_500Medium',
            textDisabledColor: colors.mutedForeground + '40',
            arrowColor: colors.primary,
            todayTextColor: colors.primary,
            textDayHeaderFontFamily: 'Inter_600SemiBold',
          }}
        />
      </View>

      <View style={styles.listSection}>
        <Text style={[styles.listHeader, { color: colors.foreground }]}>
          Pendientes del {selectedDate.split('-').reverse().join('/')}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={selectedNotes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmptyDate}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]} 
        onPress={handleAddNote}
      >
        <Feather name="plus" size={24} color="#000" />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingId ? "Editar Pendiente" : "Nuevo Pendiente"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            
            <Text style={[styles.dateSubtitle, { color: colors.primary }]}>
              Para el día: {selectedDate.split('-').reverse().join('/')}
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Título *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} 
                placeholder="Ej: Seguimiento cliente X" 
                placeholderTextColor={colors.mutedForeground}
                value={noteTitle}
                onChangeText={setNoteTitle} 
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Descripción (Opcional)</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} 
                placeholder="Detalles de la tarea..." 
                placeholderTextColor={colors.mutedForeground}
                multiline 
                value={noteDesc}
                onChangeText={setNoteDesc} 
              />
            </View>

            {/* BOTÓN BLINDADO */}
            <Pressable 
              onPress={saveNote} 
              disabled={isSaveDisabled} 
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaveDisabled ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>{editingId ? "Actualizar Tarea" : "Guardar Tarea"}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, zIndex: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  calendarWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  calendarObj: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden', shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  listSection: { flex: 1 },
  listHeader: { fontFamily: 'Inter_700Bold', fontSize: 15, marginHorizontal: 20, marginTop: 10, marginBottom: 12 },
  itemCard: {
    borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, flex: 1, marginLeft: 10 },
  iconBadge: { padding: 6, borderRadius: 8 },
  deleteBtn: { padding: 4, marginLeft: 10 },
  itemDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 15, marginBottom: 16 },
  emptyBtn: { borderWidth: 1, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  emptyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  closeBtn: { padding: 4 },
  dateSubtitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontFamily: 'Inter_400Regular' },
  textArea: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  saveBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#000' }
});
