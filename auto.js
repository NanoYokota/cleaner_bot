function remindCleanup()
{
  const funcName = "remindCleanup";
  if ( !isToday( nameListSh.getMember( "on", "flag" )[ 4 ] ) ) {
    return;
  }
  const message = buildRemindMessage();
  // CWで通知
  if ( DEBUG ) {
    sendMessageCw( message, roomId_test );
  } else {
    sendMessageCw( message, roomId_fukuoka );
  }
  // 次の掃除担当へフラグを移動。
  nameListSh.switchCleaner();
  nameListSh.updateCleaningDates();
}