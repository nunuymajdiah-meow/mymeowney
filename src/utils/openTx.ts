import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Tx } from '../types';

// Transaksi yang dibuat otomatis (dari Hutang/Piutang atau biaya admin transfer)
// diatur lewat sumbernya, bukan diedit langsung.
export const linkedTxInfo = (tx: Tx) =>
  tx.debtId
    ? Alert.alert('Dibuat dari Hutang/Piutang', 'Transaksi ini diatur lewat tab Hutang. Batalkan cicilan atau hapus catatannya di sana.')
    : Alert.alert('Biaya admin transfer', 'Biaya ini diatur lewat transfernya. Ketuk baris transfer di tab Transaksi untuk mengubah atau menghapusnya.');

export function openTx(tx: Tx) {
  if (tx.debtId || tx.transferId) return linkedTxInfo(tx);
  router.push({ pathname: '/tambah-transaksi', params: { id: tx.id } });
}
