function FindProxyForURL(url, host) {
    if (host === "testpages.adblockplus.org") {
        return "PROXY http://localhost:3005"; 
    }
    return "DIRECT";
}