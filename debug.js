function test()
{
}

function log( functionName, value, options = { label: "", output: "log", type: "log", lineTwo: false, } )
{
  const funcName = "log";
  const logLabel = buildLogLabel( functionName, options.type );
  let message = "";
  if ( options.lineTwo ) {
    if ( !options.label ) {
      throw `[ERROR: ${ funcName }] The argument options.label must not be empty when value is object.`;
    }
    message += `${ logLabel }${ options.label } ↓`;
  } else {
    message += !options.label ? `${ logLabel }` : `${ logLabel }${ options.label } : `;
    message += value;
  }
  if ( options.output == "return" ) {
    return message;
  } else {
    if ( options.lineTwo ) {
      if ( options.type == "error" ) {
        console.error( message );
        console.error( value );
      } else {
        console.log( message );
        console.log( value );
      }
    } else {
      if ( options.type == "error" ) {
        throw message;
      } else {
        console.log( message );
      }
    }
  }
}

function buildLogLabel( functionName, type )
{
  const funcName = "logMessage";
  if ( !functionName ) {
    throw`[ERROR: ${ funcName }] The argument functionName must not be empty.`;
  }
  let logLabel;
  if ( type == "error" ) {
    logLabel = `[ERROR: ${ functionName }] `;
  } else if ( type == "info" ) {
    logLabel = `[INFO: ${ functionName }] `;
  } else if ( type == "warn" ) {
    logLabel = `[WARNING: ${ functionName }] `;
  } else {
    logLabel = `[DEBUG: ${ functionName }] `;
  }
  return logLabel;
}
