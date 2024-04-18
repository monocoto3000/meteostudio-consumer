import * as amqplib from 'amqplib/callback_api';

let dataArray: { station_id: number; temperature: number; humidity: number; radiation: number }[] = [];

async function connect() {
  const USERNAME = "meteostudio"
  const PASSWORD = encodeURIComponent("CMdui89!gdDDD145x?")
  const HOSTNAME = "100.25.187.231"
  const PORT = 5672
  try {
    amqplib.connect(`amqp://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}`, (err: any, conn: amqplib.Connection) => {
      if (err) throw err;

      conn.createChannel((errChanel: any, channel: amqplib.Channel) => {
        if (errChanel) throw new Error(errChanel);

        channel.assertQueue();

          channel.consume("Meteorological", async (data: amqplib.Message | null) => {
            if (data?.content !== undefined) {
              console.log(`Datos de la estacion: ${data.content}`);
              const content = data?.content;
              const parsedContent = JSON.parse(content.toString());

              dataArray.push({
                station_id: parsedContent.station_id,
                temperature: parsedContent.temperature,
                humidity: parsedContent.humidity,
                radiation: parsedContent.radiation,
              });

              channel.ack(data);

              console.log(dataArray)
            }
          });

          setInterval(() => {

          console.log("Enviando datos a la API...");
          fetch("http://3.221.32.128/data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataArray),
          })
            .then(() => {
              console.log("Datos enviados exitosamente");
              dataArray = [];
            })
            .catch((err: any) => {
              throw err;
            });
        }, 30000);
      });
    });
  } catch (err: any) {
    throw err;
  }
}

connect();
