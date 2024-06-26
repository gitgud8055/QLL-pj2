import static java.lang.Integer.parseInt;
import static java.lang.Long.parseLong;
import static java.lang.System.exit;
 
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.StringTokenizer;
 
public class a {
 
	static void solve() throws Exception {
		int n = scanInt(), p = scanInt();
        String s = scanString();
        int[] a = new int[n + 1];
        int[] cnt = new int[p];
        long ans = 0;
        ++cnt[0];
        for (int i = 1; i <= n; i++) {
            a[i] = (a[i-1] + (s.charAt(i-1) - '0')) % p;
            ans += (long)cnt[a[i]];
            ++cnt[a[i]];
        }
        out.println(ans); 
	}
 
	static int scanInt() throws IOException {
		return parseInt(scanString());
	}
 
	static long scanLong() throws IOException {
		return parseLong(scanString());
	}
 
	static String scanString() throws IOException {
		while (tok == null || !tok.hasMoreTokens()) {
			tok = new StringTokenizer(in.readLine());
		}
		return tok.nextToken();
	}
 
	static BufferedReader in;
	static PrintWriter out;
	static StringTokenizer tok;
 
	public static void main(String[] args) {
		try {
			in = new BufferedReader(new InputStreamReader(System.in));
			out = new PrintWriter(System.out);
			solve();
			in.close();
			out.close();
		} catch (Throwable e) {
			e.printStackTrace();
			exit(1);
		}
	}
}