from kubernetes import client, config
import database
import asyncio
import time

class TranslationPodManager:
    def __init__(self, url='localhost', port=27017):
        self.dbc = database.DatabaseController(url, port)
        
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        
    async def create_pod(self, names):
        dep = {'apiVersion': 'v1',
               'kind': 'Pod',
               'metadata': {'labels': {'purpose': 'translate-rr'}},
               'spec': {'containers': [{'image': 'registry.digitalocean.com/sproj/rr:translation',
                                        'name': 'rr-test-container',
                                        'securityContext': {'capabilities': {'add': ['SYS_PTRACE']}}}],
                        'restartPolicy': 'OnFailure'}}
        channel = self.dbc.add_pod(self.dbc.get_userids_by_name(names))
        dep['metadata']['name'] = channel
        resp = self.v1.create_namespaced_pod(
            body=dep, namespace='default')
        print("Pod created.  status='%s'" % resp.metadata.name)
        return channel


    async def delete_pod(self, channel):
        """Given a channel, delete a pod"""
        self.v1.delete_namespaced_pod(channel, 'default')
        # Wait for double pod's maximum termination time (30 seconds).
        # Waiting for termination eliminates the scenario where a pod
        # is created with the same channel as a pod that is still
        # terminating.  Creation of the new pod would fail.
        await asyncio.sleep(60)
        self.dbc.delete_pod(self.dbc.get_pod_by_channel(channel))
        # while True:
        #     try:
        #         print(channel)
        #         print(self.v1.read_namespaced_pod_status(channel, 'default').status.container_statuses[0].state.terminated)
        #         await asyncio.sleep(1)
        #     except:
        #         self.dbc.delete_pod(self.dbc.get_pod_by_channel(channel))
        #         break

    def link_pod_to_users(self, channel, names):
        pod = self.dbc.get_pod_by_channel(channel)
        uids = self.dbc.get_userids_by_name(names)
        self.dbc.link_pod_to_users(pod, uids)

    def unlink_pod_from_users(self, channel, names):
        pod = self.dbc.get_pod_by_channel(channel)
        uids = self.dbc.get_userids_by_name(names)
        self.dbc.unlink_pod_from_users(pod, uids)

    def add_user(self, name):
        """Given a name, attempt to add the user into the database"""
        try:
            self.dbc.add_user(name)
        except:
            raise database.DuplicateUserError

    def delete_user(self, name):
        """Given a name, delete a user"""
        self.dbc.delete_user(self.dbc.get_userids_by_name([name])[0])
