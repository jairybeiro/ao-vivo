export interface Channel {
  id: string;
  name: string;
  streamUrls: string[];
  logo?: string;
}

export const defaultChannels: Channel[] = [
  {
    id: "globonews",
    name: "GloboNews",
    streamUrls: [
      "https://d1muf25xa01so8hp07.s27-usa-cloudfront-net.online/token/d096b8d8675234a57b38b88824d868e7/globonews.m3u8",
      "https://d1muf25xa01so8hp07.s27-usa-cloudfront-net.online/token/d096b8d8675234a57b38b88824d868e7/globonews.m3u8",
    ],
  },
];
