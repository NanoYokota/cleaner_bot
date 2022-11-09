
function sendMessageCw( message = "", roomID = roomId_test )
{
  const url = `${ CW_ENDPOINT_URL }/rooms/${ roomID }/messages`;
  let options = {
    'method' : 'POST',
    'accept' : 'application/json',
    'headers' : {
      "x-chatworktoken" : CW_API_TOKEN,
      "content-type": "application/x-www-form-urlencoded",
    },
    "muteHttpExceptions" : true,
    'payload' : {
      'body': message,
    },
  };
  let response;
  try {
    response = UrlFetchApp.fetch( url, options );
  } catch( e ) {
    response = e;
  }
  return response;
}

function contactsList()
{
  const url = `${ CW_ENDPOINT_URL }/contacts`;
  const options = {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'x-chatworktoken': CW_API_TOKEN,
    },
  };
  let response;
  try {
    response = UrlFetchApp.fetch( url, options );
  } catch( e ) {
    response = e;
  }
  if ( DEBUG ) {
    console.log( JSON.parse( response ) );
  }
  return response;
}

function roomId( accountId )
{
  const response = contactsList( accountId );
  const data = JSON.parse( response );
  for ( let i = 0; i < data.length; i++ ) {
    const contact = data[ i ];
    if ( DEBUG ) {
      console.log( contact );
    }
    if ( contact.account_id == accountId ) {
      return contact.room_id;
    }
  }
  return false;
}

function remindCleanup()
{
  const funcName = "remindCleanup";
  const indexes = nameListSh.getMemberIndexes( "on", "flag" );
  const members = nameListSh.member.values.raw;
  let memberOn = members[ indexes.on ];
  if ( !memberOn ) {
    throw `[ERROR: ${ funcName }] The flag is not detected.`;
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] memberOn ↓` );
    console.log( memberOn );
  }
  // リマインドメッセージの組み立て
  let message = `[To:${ memberOn[ 1 ] }] ${ memberOn[ 0 ] }さん\n`;
  message += "今日のトイレ掃除当番です。\n";
  message += "よろしくお願いします。\n";
  const week = 4;
  message += "[info][title]" + week + "週間先までの担当者[/title]\n";
  // 来週以降の担当者と日付を組み立て
  let count = 0;
  for ( let i = indexes.on + 1; i < members.length; i++ ) {
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] i: ${ i }` );
      console.log( `[DEBUG: ${ funcName }] count: ${ count }` );
    }
    const member  = members[ i ];
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] member ↓` );
      console.log( member );
    }
    if ( i + 1 == members.length && count < week ) {
      i = -1;
      continue;
    }
    if ( member[ 2 ] == "なし" ) {
      continue;
    }
    const month = member[ 4 ].getMonth() + 1;
    const date = member[ 4 ].getDate();
    message += `${ month }月${ date }日：${ member[ 0 ] }さん\n`;
    count++;
    if ( count >= week ) {
      break;
    }
  }
  message += `[/info]`;
  // CWで通知
  if ( DEBUG ) {
    sendMessageCw( message, roomId_test );
  } else {
    sendMessageCw( message, roomId_fukuoka );
  }
  // 次の掃除担当へフラグを移動。
  nameListSh.switchCleaner();
  // 担当者にセットするための日付を取得
  let dates = [];
  let year = yearToday;
  let month = monthToday - 1;
  let dateStart = dateToday;
  const commuteNum = nameListSh.getCommuteMemberNum();
  while( dates.length < commuteNum ) {
    for ( let i = dateStart; i <= 31; i++ ) {
      if ( DEBUG ) {
        console.log( `[DEBUG: ${ funcName }] i: ${ i }`);
      }
      const date = new Date( year, month, i );
      if ( date.getDay() == 5 && !isHoliday( date ) ) {
        dates.push( date );
      } else if ( date.getDay() == 5 && isHoliday( date ) && i - 1 > 0 ) {
        const dateThu = new Date( year, month, i - 1 );
        if ( !isHoliday( dateThu ) ) {
          dates.push( dateThu );
        } else if ( i - 2 > 0 ) {
          const dataWed = new Date( year, month, i - 2 );
          if ( !isHoliday( dataWed ) ) {
            dates.push( dataWed );
          } else if ( i - 3 > 0 ) {
            const dateTue = new Date( year, month, i - 3 );
            if ( !isHoliday( dateTue ) ) {
              dates.push( dateTue );
            } else if ( i - 4 > 0 ) {
              const dateMon = new Date( year, month, i - 4 );
              if ( !isHoliday( dateMon ) ) {
                dates.push( dateMon );
              }
            }
          }
        }
      }
      if ( dates.length >= commuteNum ) {
        break;
      }
    }
    month++;
    dateStr = 1;
    if ( month > 12 ) {
      year++;
      month = 1;
    }
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] dates ↓` );
    console.log( dates );
  }
  // セットするように配列を組み直す
  let datesForMembers = [];
  count = 0;
  for ( let i = indexes.on; i < members.length; i++ ) {
    if ( members[ i ][ 2 ] == "なし" ) {
      datesForMembers[ i ] = [ '' ];
    } else {
      datesForMembers[ i ] = [ dates[ count ] ];
      count++;
    }
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] datesForMembers ↓` );
    console.log( datesForMembers );
    console.log( `[DEBUG: ${ funcName }] datesForMembers.length: ${ datesForMembers.length }` );
  }
  for ( let i = 0; i < indexes.on; i++ ) {
    if ( members[ i ][ 2 ] == "なし" ) {
      datesForMembers[ i ] = [ '' ];
    } else {
      datesForMembers[ i ] = [ dates[ count ] ];
      count++;
    }
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] datesForMembers ↓` );
    console.log( datesForMembers );
    console.log( `[DEBUG: ${ funcName }] datesForMembers.length: ${ datesForMembers.length }` );
  }
  const rangeDate = nameListSh.getDateRange();
  rangeDate.setValues( datesForMembers );
}

function isHoliday( date )
{
  const theDate = new Date( date.setDate( date.getDate() ) );
  const weekInt = theDate.getDay();
  if ( weekInt <= 0 || 6 <= weekInt ) {
    return true;
  }
  const calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  const calendar = CalendarApp.getCalendarById( calendarId );
  const events = calendar.getEventsForDay( theDate );
  if ( events.length > 0 ) {
    return true;
  }
  if ( HOLIDAYS[ theDate.getMonth() ] ) {
    for ( let i = 0; i < HOLIDAYS[ theDate.getMonth() ].length; i++ ) {
      const holiday = HOLIDAYS[ theDate.getMonth() ][ i ];
      if ( holiday == theDate.getDate() ) {
        return true;
      }
    }
  }
  return false;
}