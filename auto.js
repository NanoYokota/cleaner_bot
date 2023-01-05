function remindCleanup()
{
  const funcName = "remindCleanup";
  if ( !isToday( nameListSh.getMember( "on", "flag" )[ 4 ] ) ) {
    log( funcName, "Today is not cleaning day.", { type: "info", } );
    return;
  }
  const message = buildRemindMessage();
  // CWで通知
  sendMessageCw( message, roomId_fukuoka );
  // 次の掃除担当へフラグを移動。
  nameListSh.switchCleaner();
  nameListSh.updateCleaningDates();
}