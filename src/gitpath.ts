import * as fs from 'fs';
import * as path from 'path';

interface IGitPathInfo {
	dir: string,
	path: string
}

export async function findGitPath(repositoryDirectory: string): Promise<IGitPathInfo> {
	return new Promise<IGitPathInfo>((resolve, reject) => {
		function recur(repoDir) {
			const repositoryPath = path.join(repoDir, '.git');

			fs.access(repositoryPath, (err) => {
				if (err) {
					const parentDirectory = path.dirname(repoDir);

					if (parentDirectory !== repoDir) {
						recur(parentDirectory);
					}
					else {
						reject(err);
					}
				}
				else {
					resolve({
						'dir': repoDir,
						'path': repositoryPath
					});
				}
			});
		}

		recur(repositoryDirectory);
	});
}
