
function sendMessageCw( message = "", roomID = roomId_test )
{
  if ( !isReleased ) {
    roomID = roomId_test;
  }
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

function cleaningDates()
{
  const funcName = "cleaningDates";
  let dates = [];
  let year = yearToday;
  let month = monthToday - 1;
  let dateStart = dateToday + 1;
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
    dateStart = 1;
    if ( month > 12 ) {
      year++;
      month = 1;
    }
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] dates ↓` );
    console.log( dates );
  }
  return dates;
}

function buildRemindMessage()
{
  const funcName = "buildRemindMessage";
  const indexes = nameListSh.member.indexes;
  const members = nameListSh.member.values.raw;
  const memberOn = members[ indexes.on ];
  if ( !memberOn ) {
    throw `[ERROR: ${ funcName }] The flag is not detected.`;
  }
  if ( DEBUG ) {
    console.log( `[DEBUG: ${ funcName }] memberOn ↓` );
    console.log( memberOn );
  }
  // リマインドメッセージの組み立て
  let message = isReleased ? `[To:${ memberOn[ 1 ] }] ${ memberOn[ 0 ] }さん\n` : "";
  message += !isReleased ? "【テスト実行】※無視してください。\n" : "";
  message += "今日のトイレ掃除当番です。\n";
  message += "よろしくお願いします。\n";
  const week = 4;
  message += "[info][title]" + week + "週間先までの担当者[/title]\n";
  // 来週以降の担当者と日付を組み立て
  let count = 0;
  for ( let i = indexes.on + 1; i < members.length; i++ ) {
    if ( i + 1 == members.length && count < week ) {
      i = -1;
      continue;
    }
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] i: ${ i }` );
      console.log( `[DEBUG: ${ funcName }] count: ${ count }` );
    }
    const member  = members[ i ];
    if ( DEBUG ) {
      console.log( `[DEBUG: ${ funcName }] member ↓` );
      console.log( member );
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
  return message;
}

function isToday( date ) {
  if (
    date.getFullYear() == yearToday &&
    date.getMonth() == monthToday - 1 &&
    date.getDate() == dateToday
  ) {
    return true;
  }
  return false;
}