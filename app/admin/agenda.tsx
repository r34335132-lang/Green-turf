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
  FlatList
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  // Guardamos TODAS las notas de la BD aquí
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. CARGAMOS LAS NOTAS UNA SOLA VEZ
  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase.from('agenda_notes').select('*').order('created_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // 2. CREAMOS LOS PUNTITOS PARA EL CALENDARIO
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Ponemos un puntito en los días que tienen notas
    notes.forEach(note => {
      marks[note.date_string] = { marked: true, dotColor: colors.primary };
    });
    
    // Resaltamos el día seleccionado
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary, selectedTextColor: '#000' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary, selectedTextColor: '#000' };
    }
    
    return marks;
  }, [notes, selectedDate, colors]);

  // 3. FILTRAMOS LAS NOTAS SOLO PARA EL DÍA SELECCIONADO
  const selectedNotes = useMemo(() => {
    return notes.filter(n => n.date_string === selectedDate);
  }, [notes, selectedDate]);

  const saveNote = async () => {
    if (!noteTitle.trim()) return;
    setSaving(true);
    
    await supabase.from('agenda_notes').insert([
      { date_string: selectedDate, title: noteTitle.trim(), description: noteDesc.trim() }
    ]);
    
    setNoteTitle('');
    setNoteDesc('');
    setModalVisible(false);
    setSaving(false);
    
    // Recargamos para ver la nueva nota
    fetchNotes();
  };

  // --- COMPONENTES DE UI ---

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
           <Feather name="file-text" size={14} color={colors.primary} />
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.itemDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderEmptyDate = () => (
    <View style={[styles.emptyContainer]}>
      <Feather name="calendar" size={40} color={colors.border} style={{ marginBottom: 12 }} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Agenda libre para este día</Text>
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={[styles.emptyBtn, { borderColor: colors.primary }]}
      >
        <Text style={[styles.emptyBtnText, { color: colors.primary }]}>+ Agregar una nota</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* REEMPLAZO DE LA AGENDA:
         Usamos un Calendar estático. Al no usar <Agenda>, el bug de React 19 / Fabric desaparece por completo.
      */}
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          calendarBackground: colors.card,
          monthTextColor: colors.foreground,
          dayTextColor: colors.foreground,
          textDisabledColor: colors.mutedForeground + '50',
          arrowColor: colors.primary,
          todayTextColor: colors.primary,
        }}
      />

      <Text style={[styles.listHeader, { color: colors.foreground }]}>
        Notas del {selectedDate}
      </Text>

      {/* LISTA NATIVA DE REACT NATIVE PARA LAS NOTAS */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={selectedNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyDate}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
        />
      )}

      {/* Botón Flotante (FAB) */}
      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]} 
        onPress={() => setModalVisible(true)}
      >
        <Feather name="plus" size={24} color="#000" />
      </Pressable>

      {/* Modal para nueva nota */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nueva Nota</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            
            <Text style={[styles.dateSubtitle, { color: colors.primary }]}>
              Para el día: {selectedDate}
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
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Descripción</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} 
                placeholder="Detalles de la nota..." 
                placeholderTextColor={colors.mutedForeground}
                multiline 
                numberOfLines={4}
                value={noteDesc}
                onChangeText={setNoteDesc} 
              />
            </View>

            <Pressable 
              onPress={saveNote} 
              disabled={saving || !noteTitle.trim()} 
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: (!noteTitle.trim() || saving) ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Nota</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, flex: 1 },
  iconBadge: { padding: 6, borderRadius: 8 },
  itemDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 15, marginBottom: 16 },
  emptyBtn: { borderWidth: 1, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  emptyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20 },
  modalContent: {
    borderRadius: 16, padding: 24, borderWidth: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  closeBtn: { padding: 4 },
  dateSubtitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontFamily: 'Inter_400Regular' },
  textArea: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#000' }
});