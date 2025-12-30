export function generatePixEmvPayload(params: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
}): string {
  const { pixKey, merchantName, merchantCity, amount, txid } = params;

  const sanitize = (value: string) => value.replace(/[\n\r]/g, " ").trim();

  const emv = (id: string, value: string) => {
    const v = sanitize(value);
    const len = v.length.toString().padStart(2, "0");
    return `${id}${len}${v}`;
  };

  // Merchant Account Information (ID 26)
  const mai = [
    emv("00", "BR.GOV.BCB.PIX"),
    emv("01", pixKey),
    // 02 = descrição (opcional)
  ].join("");

  // Additional Data Field Template (ID 62)
  const adft = [emv("05", txid)].join("");

  const amountStr = Number(amount).toFixed(2);

  // Monta payload sem CRC (63) primeiro
  const payloadNoCrc = [
    emv("00", "01"), // Payload Format Indicator
    emv("01", "11"), // Point of Initiation Method (11 = estático)
    emv("26", mai),
    emv("52", "0000"), // Merchant Category Code
    emv("53", "986"), // BRL
    emv("54", amountStr),
    emv("58", "BR"),
    emv("59", sanitize(merchantName).slice(0, 25)),
    emv("60", sanitize(merchantCity).slice(0, 15)),
    emv("62", adft),
    "6304", // CRC placeholder
  ].join("");

  const crc = crc16ccitt(payloadNoCrc);
  return `${payloadNoCrc}${crc}`;
}

function crc16ccitt(payload: string): string {
  // CRC16/CCITT-FALSE
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
